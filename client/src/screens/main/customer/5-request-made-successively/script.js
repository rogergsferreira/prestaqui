document.addEventListener('DOMContentLoaded', () => {
    const nextButton = document.querySelector('.next__button');

    nextButton.addEventListener('click', () => {
        window.location.href = '../1-customer-home/index.html';
    });
});
