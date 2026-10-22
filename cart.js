const cartStorageKey = "mannVaasamCart";
const addToCartButtons = document.querySelectorAll("[data-add-to-cart]");
const cartItemsContainer = document.querySelector("[data-cart-items]");
const cartEmptyMessage = document.querySelector("[data-cart-empty]");
const cartSummary = document.querySelector("[data-cart-summary]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCountLabels = document.querySelectorAll("[data-cart-count]");

const products = Array.from(addToCartButtons).map((button) => ({
    name: button.dataset.name,
    price: Number(button.dataset.price)
}));

let cart = loadCart();

function loadCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");

        if (!Array.isArray(savedCart)) {
            return [];
        }

        return savedCart.reduce((items, savedItem) => {
            const product = products.find((item) => item.name === savedItem.name);
            const quantity = Number(savedItem.quantity);

            if (product && Number.isInteger(quantity) && quantity > 0) {
                items.push({ ...product, quantity });
            }

            return items;
        }, []);
    } catch (error) {
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
        // The cart still works until the page is closed if storage is unavailable.
    }
}

function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

function updateCartCount() {
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

    cartCountLabels.forEach((label) => {
        label.textContent = itemCount;
    });
}

function createQuantityButton(label, action, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quantity-button";
    button.textContent = label;
    button.setAttribute("aria-label", action === "increase" ? "Increase quantity" : "Decrease quantity");
    button.dataset.cartAction = action;
    button.disabled = disabled;
    return button;
}

function renderCart() {
    cartItemsContainer.replaceChildren();

    cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");
        details.className = "cart-item-details";

        const name = document.createElement("h3");
        name.className = "cart-item-name";
        name.textContent = item.name;

        const price = document.createElement("p");
        price.className = "cart-item-price";
        price.textContent = `${formatPrice(item.price)} each`;

        details.append(name, price);

        const controls = document.createElement("div");
        controls.className = "cart-item-controls";
        controls.append(createQuantityButton("−", "decrease", item.quantity === 1));

        const quantity = document.createElement("span");
        quantity.className = "cart-item-quantity";
        quantity.textContent = item.quantity;
        quantity.setAttribute("aria-label", `Quantity: ${item.quantity}`);
        controls.append(quantity, createQuantityButton("+", "increase"));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "cart-remove";
        remove.textContent = "Remove";
        remove.dataset.cartAction = "remove";
        remove.setAttribute("aria-label", `Remove ${item.name} from cart`);
        controls.append(remove);

        const subtotal = document.createElement("strong");
        subtotal.className = "cart-item-subtotal";
        subtotal.textContent = formatPrice(item.price * item.quantity);

        row.dataset.productName = item.name;
        row.append(details, controls, subtotal);
        cartItemsContainer.append(row);
    });

    const total = cart.reduce((amount, item) => amount + item.price * item.quantity, 0);
    cartTotal.textContent = formatPrice(total);
    cartEmptyMessage.hidden = cart.length > 0;
    cartSummary.hidden = cart.length === 0;
    updateCartCount();
}

function addProduct(product) {
    const existingItem = cart.find((item) => item.name === product.name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    renderCart();
}

addToCartButtons.forEach((button) => {
    button.addEventListener("click", () => {
        addProduct({
            name: button.dataset.name,
            price: Number(button.dataset.price)
        });
    });
});

cartItemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");

    if (!button) {
        return;
    }

    const row = button.closest("[data-product-name]");
    const item = cart.find((cartItem) => cartItem.name === row.dataset.productName);

    if (button.dataset.cartAction === "remove") {
        cart = cart.filter((cartItem) => cartItem.name !== row.dataset.productName);
    } else if (item && button.dataset.cartAction === "increase") {
        item.quantity += 1;
    } else if (item && button.dataset.cartAction === "decrease" && item.quantity > 1) {
        item.quantity -= 1;
    }

    saveCart();
    renderCart();
});

renderCart();
