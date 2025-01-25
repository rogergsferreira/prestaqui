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
