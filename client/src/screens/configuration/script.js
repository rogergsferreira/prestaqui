document.addEventListener('DOMContentLoaded', () => {
    const switchProfileButton = document.querySelector('.switch-profile');
    const createSecondUserTypeButton = document.querySelector('.create-provider');
    const logoutButton = document.querySelector('.logout');
    const deleteAccountButton = document.querySelector('.delete-account');
    const changeProfileButton = document.querySelector('.change-profile');
    let userId;
    let userType;

    const checkUserTypeAndSession = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/get-session');
            if (response.status === 401) {
                console.error('No active session');
                return;
            }
            const data = await response.json();

            if (!data.user) {
                console.error('Nenhum usuário logado');
                return;
            }

            userId = data.user.id;
            userType = data.user.userType;

            const profileTypeResponse = await fetch(`http://localhost:3000/api/user/get-profile-type/${userId}`);
            const profileType = await profileTypeResponse.text();

            if (profileType === 'customer_service_provider') {
                switchProfileButton.style.display = 'block';
                createSecondUserTypeButton.style.display = 'none';
            } else {
                switchProfileButton.style.display = 'none';
                createSecondUserTypeButton.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao verificar o tipo de usuário:', error.message);
        }
    };

    createSecondUserTypeButton.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:3000/api/user/add-second-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userType: userId }),
                credentials: 'same-origin',
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                if (result.message.includes('customer')) {
                    window.location.href = './service-provider-category/index.html';
                } else {
                    switchProfileButton.style.display = 'block';
                    createSecondUserTypeButton.style.display = 'none';
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Erro ao criar segundo perfil:', error);
        }
    });

    changeProfileButton.addEventListener('click', () => {
        window.location.href = '/profile-setup';
    });

    switchProfileButton.addEventListener('click', () => {
        if (userType === 'customer') {
            window.location.href = './service_provider_login.html';
        } else {
            window.location.href = './customer_login.html';
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
            });

            if (response.ok) {
                window.location.href = '/login';
            } else {
                console.error('Erro ao encerrar sessão');
            }
        } catch (error) {
            console.error('Erro ao encerrar sessão:', error);
        }
    });

    deleteAccountButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/user/delete-user/${userId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            });

            if (response.ok) {
                window.location.href = '/login';
            } else {
                console.error('Erro ao excluir a conta');
            }
        } catch (error) {
            console.error('Erro ao excluir a conta:', error);
        }
    });

    checkUserTypeAndSession();
});
