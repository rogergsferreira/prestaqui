document.addEventListener("DOMContentLoaded", () => {
    const userType = localStorage.getItem('userType');

    if (!userType) {
        window.location.href = "./../../../public/index.html";
        return;
    }

    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const title = document.getElementById("title");
    const registerLink = document.getElementById("registerLink");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");

    if (userType === "customer") {
        title.textContent = "Login Cliente";
        registerLink.setAttribute("href", "./../register/register-customer/1-customer-registration/index.html");
        forgotPasswordLink.setAttribute("href", "#"); // ainda não tem essa melhoria
    } else if (userType === "service_provider") {
        title.textContent = "Login Prestador de Serviços";
        registerLink.setAttribute("href", "./../register/register-service-provider/1-service-provider-registration/index.html");
        forgotPasswordLink.setAttribute("href", "#"); // ainda não tem essa melhoria
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, userType }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                alert(errorMessage || "Erro ao fazer login");
                return;
            }

            const responseData = await response.json();

            localStorage.setItem('userId', responseData.id);
            localStorage.setItem('email', responseData.email);
            localStorage.setItem('userType', responseData.userType);

            if (userType === "customer") {
                window.location.href = "./../main/customer/1-customer-home/index.html";
            } else if (userType === "service_provider") {
                window.location.href = "./../main/service-provider/1-service-provider-home/index.html";
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro interno. Tente novamente mais tarde.");
        }
    });
});
