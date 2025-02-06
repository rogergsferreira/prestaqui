document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();

    const category = document.querySelector('input[name="category"]:checked')?.value;
    const state = document.getElementById('state').value.trim();
    const city = document.getElementById('city').value.trim();
    const service_title = document.getElementById('service_title').value.trim();
    const description = document.getElementById('description').value.trim();
    const date = document.getElementById('date').value;
    const period = document.querySelector('input[name="period"]:checked')?.value;

    const userType = localStorage.getItem('userType');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');

    if (!category || !state || !city || !service_title || !description || !date || !period) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    if (!userId || userType !== 'customer') {
        alert('Usuário não autenticado ou tipo de usuário inválido.');
        window.location.href = '../../../../../public/index.html';
        return;
    }

    const formData = {
        category,
        state,
        city,
        service_title,
        description,
        date,
        period,
        customer_id: userId
    };

    fetch('http://localhost:3000/api/services/submitSolicitation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = '../5-request-made-successively/index.html';
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao enviar a solicitação.');
        });
});
