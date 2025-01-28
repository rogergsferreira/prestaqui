document.addEventListener('DOMContentLoaded', () => {
    const nextButton = document.querySelector('.next__button');

    nextButton.addEventListener('click', () => {
        localStorage.removeItem('serviceProviderData');
        window.location.href = './../../../../../public/index.html';
    });
});
