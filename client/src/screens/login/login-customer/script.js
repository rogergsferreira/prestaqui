document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const userType = "customer";

        // validação simples dos campos
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

            const responseData = await response.text();
            if (responseData === "Logged in successfully!") {
                window.location.href = "./../../main/customer/1-customer-home/index.html"; // Certifique-se de que o caminho está correto
            } else {
                alert(responseData); // mensagem de erro
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro interno. Tente novamente mais tarde.");
        }
    });
});
