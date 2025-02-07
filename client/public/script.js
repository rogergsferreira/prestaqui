document.addEventListener('DOMContentLoaded', () => {
    localStorage.clear();

    const serviceProviderLink = document.getElementById('serviceProviderLink');
    const customerLink = document.getElementById('customerLink');

    serviceProviderLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.setItem('userType', 'service_provider');
        window.location.href = serviceProviderLink.getAttribute('href');
    });

    customerLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.setItem('userType', 'customer');
        window.location.href = customerLink.getAttribute('href');
    });
});