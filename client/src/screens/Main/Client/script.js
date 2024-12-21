// função para carregar as informações do usuário
function loadUserInfo() {
    fetch('/user')
        .then(response => response.json())
        .then(data => {
            document.getElementById('user__name').textContent = data.user_name;
            document.getElementById('user__profile').src = data.user_avatar_path || 'https://robohash.org/default';
        })
        .catch(error => console.error('erro ao carregar informações do usuário:', error));
}

// função para carregar os agendamentos
function loadScheduling() {
    fetch('/scheduling')
        .then(response => response.json())
        .then(data => {
            const schedulingContainer = document.querySelector('.scheduling__container');
            schedulingContainer.innerHTML = ''; // limpa os agendamentos anteriores

            data.forEach(scheduling => {
                const schedulingCard = document.createElement('div');
                schedulingCard.classList.add('scheduling', 'card__pendente');

                schedulingCard.innerHTML = `
                    <h3 id="scheduling__title">#${scheduling.id} - ${scheduling.title}</h3>
                    <div class="service__provider__info">
                        <h4> prestador: </h4>
                        <div id="service__provider__name">${scheduling.service_provider_name}</div> 
                        <img src="../../../assets/img/whatsapp-logo.png" alt="Whatsapp" id="whatsapp-logo">
                    </div>
                    <h4> horário <span id="scheduling__time">${new Date(scheduling.date_time).toLocaleString()}</span></h4>
                    <h4> descrição: <span id="scheduling__description">${scheduling.description}</span></h4>
                    <h4>status: </h4>
                    <span id="scheduling__status" class="pendente">${scheduling.status}</span>
                    <h4>categoria:</h4>
                    <div class="category" id="scheduling__categories">
                        <div class="${scheduling.category.toLowerCase()}">${scheduling.category.toUpperCase()}</div>
                    </div>
                    <button class="scheduling__cancel" onclick="cancelScheduling(${scheduling.id})">CANCELAR VISITA</button>
                `;

                schedulingContainer.appendChild(schedulingCard);
            });
        })
        .catch(error => console.error('erro ao carregar agendamentos:', error));
}

// função para cancelar um agendamento
function cancelScheduling(schedulingId) {
    fetch(`/scheduling/${schedulingId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (response.ok) {
                alert('Agendamento cancelado com sucesso!');
                loadScheduling();
            } else {
                alert('erro ao cancelar agendamento');
            }
        })
        .catch(error => console.error('erro ao cancelar agendamento:', error));
}

// função para redirecionar para a página de novo agendamento
function goToNewSchedulingPage() {
    window.location.href = '/new-scheduling.html'; // caminho para a nova página html
}

// carrega as informações iniciais quando a página é carregada
window.onload = () => {
    loadUserInfo();
    loadScheduling();
    document.querySelector('.new__scheduling').onclick = goToNewSchedulingPage;
};
