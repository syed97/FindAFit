import React from 'react';
import './ImageDisplay.css'; // Styles specific to this component

function ImageDisplay({ products, currentView, cartItems, onAddToCart, onRemoveFromCart }) {
  const hasProducts = products && products.length > 0;
  const isCartView = currentView === 'cart';

  return (
    <div className="image-display-container">
      {hasProducts ? (
        <div className="image-grid">
          {products.map((product) => {
            // Check if the current product is already in the cart
            const isInCart = cartItems.some(item => item.id === product.id);

            return (
              <div key={product.id} className="image-card">
                <img
                  src={`/images/${product.id}.jpg`}
                  alt={product.name || `Product ${product.id}`}
                  className="suggested-image"
                  onError={(e) => {
                      e.target.onerror = null;
                      e.target.src="/images/placeholder.png";
                      e.target.style.objectFit = 'contain';
                      e.target.parentElement.classList.add('has-error');
                  }}
                />
                {/* Action Button (Add or Remove) */}
                <button
                  className={`card-action-button ${isCartView ? 'remove' : 'add'} ${isInCart && !isCartView ? 'added' : ''}`}
                  onClick={() => isCartView ? onRemoveFromCart(product.id) : onAddToCart(product)}
                  // Disable add button if item is already in cart when in suggestions view
                  disabled={!isCartView && isInCart}
                  aria-label={isCartView ? `Remove ${product.name} from cart` : `Add ${product.name} to cart`}
                  title={isCartView ? 'Remove from Cart' : (isInCart ? 'Item in Cart' : 'Add to Cart')} // Tooltip
                >
                  {/* Icon changes based on view and cart status */}
                  {isCartView ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                    </svg> // Trash Icon
                  ) : isInCart ? (
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                       <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
                     </svg> // Checkmark Icon
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                       <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
                    </svg> // Plus Icon
                  )}
                </button>

                {/* Overlay for product details - shown on hover */}
                <div className="image-overlay">
                  <h4 className="overlay-name">{product.name}</h4>
                  <p className="overlay-desc">{product.description}</p>
                  <span className="overlay-id">ID: {product.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
         // Show different placeholder text depending on the view
        <div className="image-placeholder">
           <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className={`bi placeholder-icon ${isCartView ? 'bi-cart3' : 'bi-card-image'}`} viewBox="0 0 16 16">
             {isCartView ? (
                 <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l.84 4.479 9.144-.459L13.89 4zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
             ) : (
                <> {/* Original image placeholder path */}
                  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                  <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3.5a.5.5 0 0 1 .5-.5z"/>
                </>
             )}
           </svg>
          <p className="placeholder-text">
            {isCartView ? 'Your cart is empty. Add items from suggestions!' : 'Style suggestions appear here'}
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageDisplay;