document.addEventListener('DOMContentLoaded', function () {
    // Define a data mínima como hoje
    let today = new Date().toISOString().split('T')[0];
    const data = new Date(today).setDate(new Date().getDate());
    // ARRUMAR ISSO EM CAASA
    document.getElementById('date').setAttribute('min', data);

    console.log(data);
    


    // Define o horário mínima se for hoje, distância miníma de horário para o agendamento deve ser de duras horas a partir da hora atual

    function refreshTime() {
        const thisMoment = new Date();
        const dataSelecionada = document.getElementById('date').value;
        const inicio = document.getElementById('Inicio');
        const termino = document.getElementById('Termino');

        if( dataSelecionada == today){
            inicio.setAttribute('min', (thisMoment.getHours()+2) );
            termino.setAttribute('min', (thisMoment.getHours()+4) );
        }
      }
      setInterval(refreshTime, 1000);

    let intervaloHorarioSelecionado = null;

    // Adiciona evento de clique aos intervalos de horário
    document.querySelectorAll('.intervalo-horario').forEach(slot => {
        slot.addEventListener('click', function () {
            if (intervaloHorarioSelecionado) {
                intervaloHorarioSelecionado.classList.remove('selecionado');
            }
            intervaloHorarioSelecionado = this;
            intervaloHorarioSelecionado.classList.add('selecionado');
        });
    });

    // Adiciona evento de clique ao botão de confirmação
    document.getElementById('botao-confirmar').addEventListener('click', function () {
        const dataSelecionada = document.getElementById('date').value;
        if (!dataSelecionada) {
            alert('Por favor, selecione uma data.');
            return;
        }
        if (!intervaloHorarioSelecionado) {
            alert('Por favor, selecione um horário.');
            return;
        }
        const horarioSelecionado = intervaloHorarioSelecionado.getAttribute('data-time');
        alert(`Visita confirmada para o dia ${dataSelecionada} no horário ${horarioSelecionado}.`);
    });
});