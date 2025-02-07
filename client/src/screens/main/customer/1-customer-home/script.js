document.addEventListener('DOMContentLoaded', () => {

    // Função para normalizar textos
    function normalizeText(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    function filterScheduling(status) {
        const schedulingCards = document.querySelectorAll('.scheduling__container .scheduling');

        schedulingCards.forEach(card => {
            const cardStatusElement = card.querySelector('.status');
            if (cardStatusElement) {
                const cardStatus = cardStatusElement.textContent.trim();

                if (status === 'Todos' || cardStatus === status) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }


    // Função para inicializar o filtro de status
    function initFilterScheduling() {
        const dropdown = document.querySelector(".dropdown");
        const button = document.querySelector(".dropdown-btn");
        const radios = document.querySelectorAll(".dropdown-menu input[type='radio']");

        if (!dropdown || !button || radios.length === 0) {
            console.error('Elementos do filtro não encontrados.');
            return;
        }

        button.addEventListener("click", function () {
            const expanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", !expanded);
            dropdown.classList.toggle("open");
        });

        radios.forEach(radio => {
            radio.addEventListener("change", function () {
                setTimeout(() => {
                    const label = document.querySelector(`label[for="${this.id}"]`).textContent;
                    const selectedStatus = this.value;

                    button.textContent = label.trim();
                    dropdown.classList.remove("open");
                    button.setAttribute("aria-expanded", "false");

                    // Filtrar os agendamentos com base no status selecionado
                    filterScheduling(selectedStatus);
                }, 150);
            });
        });

        // Fechar o dropdown ao clicar fora dele
        document.addEventListener("click", function (event) {
            if (!dropdown.contains(event.target) && dropdown.classList.contains('open')) {
                dropdown.classList.remove("open");
                button.setAttribute("aria-expanded", "false");
            }
        });
    }


    function loadUserInfo() {
        const userType = localStorage.getItem('userType');
        const userId = localStorage.getItem('userId');
        const email = localStorage.getItem('email');

        if (userId && userType) {
            fetch(`http://localhost:3000/api/user/get-user/${userId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro HTTP! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(user => {
                    document.getElementById('user__name').textContent = user.name;
                    document.getElementById('user__profile').src = user.avatar_path || 'https://robohash.org/default';

                    loadScheduling(userId);
                })
                .catch(error => console.error('Erro ao carregar as informações do usuário:', error));
        } else {
            window.location.href = '../../../../../public/index.html';
        }
    }

    function loadScheduling(userId) {
        fetch(`http://localhost:3000/api/services/get-services/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Filtrar serviços com status diferente de "Concluído" e "Cancelado"
                const filteredData = data.filter(scheduling => scheduling.status !== 'Concluído' && scheduling.status !== 'Cancelado');
                updateSchedulingStatus(filteredData);
                // Renderizar os agendamentos
                renderSchedulings(filteredData);
            })
            .catch(error => console.error('Erro ao carregar os agendamentos:', error));
    }

    function renderSchedulings(schedulings) {
        const schedulingContainer = document.querySelector('.scheduling__container');
        schedulingContainer.innerHTML = '';

        schedulings.forEach(scheduling => {
            const schedulingCard = document.createElement('div');
            schedulingCard.classList.add('scheduling');

            // Definir a cor de fundo do card com base no status
            let cardColor = '';
            switch (scheduling.status) {
                case 'Em busca':
                    cardColor = 'orange';
                    schedulingCard.classList.add('card__embusca');
                    break;
                case 'Agendado':
                    cardColor = 'blue';
                    schedulingCard.classList.add('card__agendado');
                    break;
                case 'Em andamento':
                    cardColor = 'gray';
                    schedulingCard.classList.add('card__emandamento');
                    break;
                default:
                    cardColor = 'white';
            }

            schedulingCard.style.backgroundColor = cardColor;

            const formattedDate = formatDateToBrazilian(scheduling.service_date);

            // Montar o conteúdo do card (igual ao seu código atual)
            schedulingCard.innerHTML = `
                <h3>#${scheduling.id} - ${scheduling.title}</h3>
                <div class="service__provider__info">
                    <h4>Prestador:</h4>
                    <div>${scheduling.provider_name || 'Aguardando prestador'}</div>
                    ${scheduling.provider_phone ? `<a href="https://wa.me/${scheduling.provider_phone}" target="_blank">
                        <img src="../../../assets/img/whatsapp-logo.png" alt="Whatsapp">
                    </a>` : ''}
                </div>
                <h4>Descrição:</h4> <span>${scheduling.service_description}</span>
                <h4>Data:</h4> <span>${formattedDate}</span>
                <h4>Período:</h4> <span>${scheduling.day_shift}</span>
                <h4>Status:</h4>
                <span class="status ${scheduling.status.toLowerCase()}">${scheduling.status}</span>
                <h4>Categoria:</h4>
                <div class="category">
                    <div class="${scheduling.category_name ? scheduling.category_name.toLowerCase() : ''}">
                        ${scheduling.category_name ? scheduling.category_name.toUpperCase() : ''}
                    </div>
                </div>
                ${['Em busca', 'Agendado'].includes(scheduling.status) ? `
                    <button class="scheduling__cancel" data-id="${scheduling.id}" data-status="${scheduling.status}">
                        CANCELAR SERVIÇO
                    </button>
                ` : ''}
                ${scheduling.status === 'Em andamento' ? `
                    <button class="scheduling__complete" onclick="completeScheduling(${scheduling.id})">
                        CONCLUIR SERVIÇO
                    </button>
                ` : ''}
            `;

            // Adicionar o card ao container
            schedulingContainer.appendChild(schedulingCard);

            const cancelButton = schedulingCard.querySelector('.scheduling__cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    const schedulingId = cancelButton.getAttribute('data-id');
                    const status = cancelButton.getAttribute('data-status');

                    // Verificar se o status permite o cancelamento
                    if (['Agendado', 'Em busca'].includes(status)) {
                        if (confirm('Tem certeza que deseja cancelar este serviço?')) {
                            cancelScheduling(schedulingId);
                        }
                    } else {
                        alert('Este serviço não pode ser cancelado no status atual.');
                    }
                });
            }
        });

        // Inicializar o filtro de agendamentos
        initFilterScheduling();
    }


    function getCurrentPeriod() {
        const now = new Date();
        const hour = now.getHours();

        if (hour >= 6 && hour < 12) {
            return 'Manhã';
        } else if (hour >= 12 && hour < 18) {
            return 'Tarde';
        } else {
            return 'Noite';
        }
    }


    function updateSchedulingStatus(schedulings) {
        const currentDate = new Date();
        const currentDay = currentDate.toISOString().split('T')[0]; // Formato AAAA-MM-DD
        const currentPeriod = getCurrentPeriod();

        schedulings.forEach(scheduling => {
            if (scheduling.status === 'Agendado') {
                const schedulingDate = new Date(scheduling.service_date);
                const schedulingDay = schedulingDate.toISOString().split('T')[0];

                if (schedulingDay === currentDay && scheduling.day_shift === currentPeriod) {
                    // Atualizar status para "Em andamento"
                    updateSchedulingStatusInDatabase(scheduling.id, 'Em andamento');
                    // Atualizar o status no objeto local
                    scheduling.status = 'Em andamento';
                }
            }
        });
    }




    function updateSchedulingStatusInDatabase(schedulingId, newStatus) {
        fetch(`http://localhost:3000/api/services/update-status/${schedulingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error(`Erro ao atualizar o status do agendamento ${schedulingId}:`, data.message);
                } else {
                    console.log(`Status do agendamento ${schedulingId} atualizado para ${newStatus}`);
                }
            })
            .catch(error => console.error('Erro ao atualizar o status no servidor:', error));
    }


    function cancelScheduling(schedulingId) {
        fetch(`http://localhost:3000/api/services/cancel-service/${schedulingId}`, {
            method: 'PUT'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message); // Usa a mensagem retornada pelo servidor
                    loadScheduling(localStorage.getItem('userId'));
                } else {
                    alert('Erro ao cancelar agendamento: ' + (data.message || 'Erro desconhecido.'));
                }
            })
            .catch(error => {
                console.error('Erro ao cancelar agendamento:', error);
                alert('Ocorreu um erro ao cancelar o agendamento.');
            });
    }

    function completeScheduling(schedulingId) {
        if (confirm('Confirma a conclusão deste serviço?')) {
            fetch(`http://localhost:3000/api/services/complete-service/${schedulingId}`, {
                method: 'PUT'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                        loadScheduling(localStorage.getItem('userId'));
                    } else {
                        alert('Erro ao concluir serviço: ' + (data.message || 'Erro desconhecido.'));
                    }
                })
                .catch(error => {
                    console.error('Erro ao concluir serviço:', error);
                    alert('Ocorreu um erro ao concluir o serviço.');
                });
        }
    }

    function goToNewSchedulingPage() {
        window.location.href = '../4-new-scheduling/index.html';
    }

    function formatDateToBrazilian(dateString) {
        const date = new Date(dateString);

        if (isNaN(date)) {
            return dateString;
        }

        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }



    document.querySelector('.new__scheduling').onclick = goToNewSchedulingPage;

    loadUserInfo();

});

// JavaScript para o menu hambúrguer

const hamburguerMenu = document.getElementById('hamburguer-menu');

const navItems = document.getElementById('nav-items');
const main = document.querySelector('main');

const navItem = document.querySelectorAll('.nav-item');

const closeButton = document.getElementById('close__button');

hamburguerMenu.addEventListener('click', () => {
    navItems.classList.toggle('active');
    hamburguerMenu.classList.toggle('active');
    main.classList.toggle('active');
});

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
});
