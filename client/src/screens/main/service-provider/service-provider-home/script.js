document.addEventListener('DOMContentLoaded', () => {
    function loadUserInfo() {
        fetch('/api/user/')
            .then(response => response.json())
            .then(user => {
                if (user) {
                    document.getElementById('user__name').textContent = user.userName;
                    document.getElementById('user__profile').src = user.userAvatarPath || 'https://robohash.org/default';

                    // Carregar os agendamentos do cliente logado
                    loadScheduling(user.id);
                } else {
                    window.location.href = '/login.html';
                }
            })
            .catch(error => console.error('Erro ao carregar as informações do usuário:', error));
    }

    function loadScheduling(userId) {
        fetch(`/api/services/get-services/${userId}`)
            .then(response => response.json())
            .then(data => {
                const schedulingContainer = document.querySelector('.scheduling__container');
                schedulingContainer.innerHTML = '';

                data.forEach(scheduling => {
                    const schedulingCard = document.createElement('div');
                    schedulingCard.classList.add('scheduling', 'card__pendente');
                    schedulingCard.innerHTML = `
                        <h3>#${scheduling.id} - ${scheduling.title}</h3>
                        <div class="service__provider__info">
                            <h4>Prestador: </h4>
                            <div>${scheduling.provider_name}</div>
                            <img src="../../../assets/img/whatsapp-logo.png" alt="Whatsapp">
                        </div>
                        <h4>Descrição: <span>${scheduling.description}</span></h4>
                        <h4>Status: </h4>
                        <span class="pendente">${scheduling.status}</span>
                        <h4>Categoria:</h4>
                        <div class="category">
                            <div class="${scheduling.provider_category.toLowerCase()}">${scheduling.provider_category.toUpperCase()}</div>
                        </div>
                        <button class="scheduling__cancel" onclick="cancelScheduling(${scheduling.id})">CANCELAR VISITA</button>
                    `;
                    schedulingContainer.appendChild(schedulingCard);
                });
            })
            .catch(error => console.error('Erro ao carregar os agendamentos:', error));
    }

    function cancelScheduling(schedulingId) {
        fetch(`/api/services/delete-service/${schedulingId}`, {
            method: 'DELETE'
        })
            .then(response => response.ok ? alert('Agendamento cancelado com sucesso!') : alert('Erro ao cancelar agendamento'))
            .catch(error => console.error('Erro ao cancelar agendamento:', error))
            .finally(loadUserInfo);
    }

    function goToNewSchedulingPage() {
        window.location.href = '/new-scheduling.html';
    }

    loadUserInfo();
    document.querySelector('.new__scheduling').onclick = goToNewSchedulingPage;
});


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
