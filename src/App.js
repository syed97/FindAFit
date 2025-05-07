import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from './components/ChatInterface';
import ImageDisplay from './components/ImageDisplay';
import FindAFitLogo from './components/FindAFitLogo'; // Import the logo component
import { VF_API_KEY, VF_VERSION_ID, VF_RUNTIME_ENDPOINT, IMAGE_DISPLAY_COUNT} from './config';
import './App.css'; // Main application styles


// Helper function to delete Voiceflow state
async function deleteVoiceflowState(userIdToDelete) {
  if (!userIdToDelete) return;
  console.log(`Attempting to delete state for user: ${userIdToDelete}`);
  try {
    const response = await fetch(
      `${VF_RUNTIME_ENDPOINT}/state/user/${userIdToDelete}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: VF_API_KEY,
          versionID: VF_VERSION_ID,
        },
      }
    );
    if (response.ok) {
      console.log(`Successfully deleted state for user: ${userIdToDelete}`);
      return true;
    } else {
      if (response.status === 404) {
         console.log(`User state for ${userIdToDelete} not found (likely already cleared or new session).`);
         return true; // Consider it cleared
      }
      console.error(`Failed to delete state for user ${userIdToDelete}. Status: ${response.status}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Error calling delete state API:', error);
    return false;
  }
}

function App() {
  const [userId, setUserId] = useState(uuidv4()); // Use state for userId
  const [messages, setMessages] = useState([]);
  const [currentProducts, setCurrentProducts] = useState([]); // for image display
  const [isLoading, setIsLoading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false); // Track restart process
  // State to store extracted IDs globally
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  // --- New State for Cart and View ---
  const [cartItems, setCartItems] = useState([]); // Array of product objects
  const [currentView, setCurrentView] = useState('suggestions'); // 'suggestions' or 'cart'
  

  // Function to interact with Voiceflow API
  const interact = useCallback(async (action, currentUserId) => {
    if (!currentUserId) {
        console.error("Interaction attempt failed: No User ID provided.");
        setIsLoading(false);
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'bot', text: 'Session error. Please restart.' }]);
        return;
    }

    if (!isRestarting) {
        setIsLoading(true);
    }

    try {
      console.log(`Interacting for user: ${currentUserId}`, action);
      const response = await fetch(
        `${VF_RUNTIME_ENDPOINT}/state/user/${currentUserId}/interact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: VF_API_KEY,
            versionID: VF_VERSION_ID,
          },
          body: JSON.stringify({
            action,
            config: {
              tts: false,
              stripSSML: true,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
            console.error(`Client error interacting with Voiceflow (${response.status}). Session might be invalid for user ${currentUserId}.`);
             // Avoid adding multiple session error messages
             if (!messages.some(msg => msg.text.includes('session issue'))) {
                setMessages(prev => [...prev, { id: uuidv4(), sender: 'bot', text: 'There was a session issue. Try restarting the chat.' }]);
             }
         } else {
             console.error(`HTTP error! status: ${response.status}`);
         }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Voiceflow response:", data);

      const newBotMessages = [];
      const productsExtractedFromThisResponse = []; // Store prod ID, name, desc from this specific API response

      data.forEach(trace => {
        switch (trace.type) {
          case 'speak':
          case 'text':
            if (trace.payload?.message) {
              const rawMessageText = trace.payload.message;
              const currentMessageProducts = []; // Products for *this specific* message bubble

              // Regular expression to find prod ID, PROD, DESC patterns
              const productRegex = /\[\[PROD\]\](.*?)\[\[\/PROD\]\]\s*\[\[DESC\]\](.*?)\[\[\/DESC\]\]\s*\[\[ID\]\](\d+)\[\[\/ID\]\]/gs;
              let match;
              let firstProductIndex = -1; // Track where product info starts

              // Loop through all matches to extract product data
              while ((match = productRegex.exec(rawMessageText)) !== null) {
                  // Find the starting index of the first product block
                  if (firstProductIndex === -1) {
                    firstProductIndex = match.index;
                  }

                // match[1] is the product name
                // match[2] is the description
                // match[3] is the ID
                if (match[1] && match[2] && match[3]) {
                  const product = {
                    name: match[1].trim(),
                    description: match[2].trim(),
                    id: match[3].trim(),
                  };
                  // Add to list for this specific message
                  currentMessageProducts.push(product);
                  // Add to the list for overall response processing (ImageDisplay/Cart)
                  productsExtractedFromThisResponse.push(product);
                }
              }

              // --- Clean the text for chat display ---
              let cleanedText = rawMessageText;
              if(firstProductIndex !== -1) {
                  // Take only the text *before* the first product block
                  cleanedText = rawMessageText.substring(0, firstProductIndex).trim();
              }
              // If cleanedText is empty after trimming but products exist, maybe use a default intro?
              if (!cleanedText && currentMessageProducts.length > 0) {
                  cleanedText = "Here are some items for you:"; // Example default
              }

              newBotMessages.push({
                id: uuidv4(),
                sender: 'bot',
                text: cleanedText,
                products: currentMessageProducts.length > 0 ? currentMessageProducts : undefined, // Attach products specifically for this message's display
              });
            }
            break;

          case 'end':
            console.log("Conversation ended.");
            // Optionally add a final message or disable input
            break;

          default:
            break;
        }
      });

      // Update Global Recommended Products (always do this if products found)
      if (productsExtractedFromThisResponse.length > 0) {
        console.log("Products extracted in this response:", productsExtractedFromThisResponse);
        setRecommendedProducts(prevProducts => {
          const productMap = new Map(prevProducts.map(p => [p.id, p]));
          productsExtractedFromThisResponse.forEach(p => productMap.set(p.id, p));
          const uniqueProductsArray = Array.from(productMap.values());
          console.log("Updated global recommendedProducts:", uniqueProductsArray);
          return uniqueProductsArray;
        });

        // add products for display
        setCurrentProducts(productsExtractedFromThisResponse.slice(0, IMAGE_DISPLAY_COUNT));
      }

      // Update state
      if (newBotMessages.length > 0) {
         setMessages(prev => [...prev, ...newBotMessages]);
      }

    } catch (error) {
      console.error('Error interacting with Voiceflow:', error);
      // Avoid adding duplicate generic error messages
       if (!messages.some(msg => msg.text.includes('encountered an error'))) {
          setMessages(prev => [
            ...prev,
            {
              id: uuidv4(),
              sender: 'bot',
              text: 'Sorry, I encountered an error. Please try again or restart.',
            },
          ]);
      }
    } finally {
      setIsLoading(false);
      setIsRestarting(false); // Ensure restart flag is cleared
    }
  }, [isRestarting, messages, currentView]); // Depend on messages to avoid adding duplicate errors


  // --- Cart Management Functions ---
  const addToCart = useCallback((productToAdd) => {
    setCartItems(prevCart => {
      // Prevent duplicates
      if (prevCart.some(item => item.id === productToAdd.id)) {
        return prevCart; // Already exists, return the same cart
      }
      console.log("Adding to cart:", productToAdd);
      return [...prevCart, productToAdd];
    });
  }, []); // Empty dependency array, this function doesn't depend on other state changes

  const removeFromCart = useCallback((productIdToRemove) => {
    setCartItems(prevCart => {
      console.log("Removing from cart, ID:", productIdToRemove);
      return prevCart.filter(item => item.id !== productIdToRemove);
    });
  }, []);

  const clearCart = useCallback(() => {
    console.log("Clearing cart");
    setCartItems([]);
  }, []);


  // --- View Toggle Function ---
  const toggleView = useCallback(() => {
    setCurrentView(prevView => {
        const nextView = prevView === 'suggestions' ? 'cart' : 'suggestions';
        console.log(`Switching view to: ${nextView}`);
        // If switching back to suggestions, potentially refresh currentProducts
        // from recommendedProducts if needed, or let the next interaction handle it.
        // For simplicity, we'll let the next interaction update suggestions.
        return nextView;
    });
  }, []);


  // Effect to launch conversation when userId changes (initial load & restart)
  useEffect(() => {
    if (userId) {
        console.log(`Launch effect triggered for userId: ${userId}`);
        // Show connecting message only on initial load or actual restart
        if (messages.length === 0 || (messages.length > 0 && messages[messages.length - 1].text.includes('Restarting'))) {
             setMessages([{ id: uuidv4(), sender: 'bot', text: 'Connecting...' }]);
        }
        // Clear suggestions on launch/restart start, cart persists until restart
        setCurrentProducts([]);
        // If starting fresh, make sure we are in suggestions view
        setCurrentView('suggestions');
        // type launch
        interact({ type: 'launch' }, userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Depend only on userId. `interact` is stable due to useCallback.

  // Handle sending user message
  const handleSendMessage = (userInput) => {
    if (!userInput.trim() || isLoading || isRestarting) return;
    const newUserMessage = {
      id: uuidv4(),
      sender: 'user',
      text: userInput.trim(),
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    // Send 'text' action to Voiceflow using the current userId
    interact({ type: 'text', payload: userInput.trim() }, userId);
  };

  // Handle Chat Restart
  const handleRestart = async () => {
      console.log("Restart requested.");
      setIsRestarting(true);
      setIsLoading(true); // Also set loading to disable input immediately

      // Delete the state on Voiceflow for the *current* user ID
      await deleteVoiceflowState(userId);

      // Generate a new user ID
      const newUserId = uuidv4();

      // Reset local state with a restart message
      setMessages([{ id: uuidv4(), sender: 'bot', text: 'Restarting session...' }]);
      setCurrentProducts([]); // Clear current products
      setRecommendedProducts([]); // Clear global products list
      // --- Reset Cart and View on Restart ---
      setCartItems([]);
      setCurrentView('suggestions');
      console.log("Global recommendedProducts, Cart, and View reset.");

      // Set the new user ID, which will trigger the useEffect to launch
      setUserId(newUserId);
  };

  const productsToDisplay = currentView === 'suggestions' ? currentProducts : cartItems;
  const viewButtonText = currentView === 'suggestions'
    ? `View Cart (${cartItems.length})`
    : 'View Suggestions';

    return (
      <div className="app-layout">
        <header className="app-header">
          <FindAFitLogo />
          <div className="header-buttons"> {/* Group header buttons */}
             {/* Conditionally render Clear Cart button */}
             {currentView === 'cart' && cartItems.length > 0 && (
               <button
                 onClick={clearCart}
                 className="clear-cart-button"
                 disabled={isLoading || isRestarting}
               >
                 Clear Cart
               </button>
             )}
             {/* View Toggle Button */}
             <button
               onClick={toggleView}
               className="view-toggle-button"
               disabled={isLoading || isRestarting}
             >
               {viewButtonText}
             </button>
             {/* Restart Button */}
             <button
               onClick={handleRestart}
               className="restart-button"
               disabled={isLoading || isRestarting}
             >
               Restart Chat
             </button>
          </div>
        </header>
  
        <main className="main-content">
          <div className="image-area">
            {/* Pass productsToDisplay and cart-related props */}
            <ImageDisplay
              products={productsToDisplay}
              currentView={currentView}
              cartItems={cartItems} // Pass cartItems to check if item is already added
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
            />
          </div>
          <div className="chat-area">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading || isRestarting}
            />
          </div>
        </main>
      </div>
    );
  }
  
  export default App;