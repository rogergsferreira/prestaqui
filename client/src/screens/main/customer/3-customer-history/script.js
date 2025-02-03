// Javascript to handle the filter

document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.querySelector(".dropdown");
    const button = document.querySelector(".dropdown-btn");
    const menu = document.querySelector(".dropdown-menu");
    const radios = document.querySelectorAll(".dropdown-menu input[type='radio']");

    // Open and close the menu when you select an option
    button.addEventListener("click", function () {
        let expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", !expanded);
        dropdown.classList.toggle("open");
    });

    // Close the menu when you select an option
    radios.forEach(radio => {
        radio.addEventListener("change", function () {
            setTimeout(() => {
                button.textContent = document.querySelector(`label[for="${this.id}"]`).textContent;
                dropdown.classList.remove("open");
                button.setAttribute("aria-expanded", "false");
            }, 150); 
        });
    });

    // Close the dropdown when you click outside
    document.addEventListener("click", function (event) {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove("open");
            button.setAttribute("aria-expanded", "false");
        }
    });
});






// Hamburguer menu javascript

const hamburguerMenu = document.getElementById('hamburguer-menu'); 

const navItems = document.getElementById('nav-items')
const main = document.querySelector('main'); 

const navItem = document.querySelectorAll('.nav-item'); 

const closeButton = document.getElementById('close__button')

hamburguerMenu.addEventListener('click', () => {

    navItems.classList.toggle('active'); 
    hamburguerMenu.classList.toggle('active'); 
    main.classList.toggle('active');
})

navItem.forEach(item => item.addEventListener('click', () => {
    const navItemsIsActive = navItems.classList.contains('active'); 

    if (navItemsIsActive) {
        navItems.classList.remove('active'); 
        hamburguerMenu.classList.remove('active');
        main.classList.remove('active');
    }
})); 

closeButton.addEventListener('click', () => {
    navItems.classList.remove('active'); 
        hamburguerMenu.classList.remove('active');
        main.classList.remove('active');
})