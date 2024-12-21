# Projeto Integrador - PrestAqui

PrestAqui é uma aplicação web, focada para usuários mobile, com a função de conectar prestadores de serviço com clientes que estão precisando de ajuda e suporte.

Ela permiti a comunicação e o gerenciamento mais eficiente desses serviços.

## Figma <img src="https://github.com/user-attachments/assets/1e2f00fd-6950-4939-bab2-a648992177d1" alt="image" style="width: 24px; height: auto;">

<details>
  <summary> Link para a aplicação 🔗</summary>
  <br>
  Para acessar o nosso projeto, acesse o link <a href="https://www.figma.com/design/hhf3yLfjxGL4UViC2ioBC2/PrestAqui?node-id=0-1&t=3cxi00G0lFLJdixA-1" target="_blank"> <strong> CLICANDO AQUI</strong></a>
</details>


<details>
  <summary> Fluxo do cliente 🔗</summary>
  <br>
  

O fluxo da aplicação inicia-se com as telas <em>**Main-screen**</em> e <em>**Login-Screen,**</em> onde o usuário iniciará o seu fluxo no PrestAqui.

De primeiro momento, o cliente irá selecionar o botão <em>"**ESTOU À PROCURA DE UM SERVIÇO**"</em> e será redirecionado para uma tela onde poderá preencher as suas informações de login e senha.

![image](https://github.com/user-attachments/assets/f0f0d53b-4e03-471d-ba62-c8f2ca31d3b9)

Caso o cliente ainda não possua um cadastro, ele poderá selecionar o botão chamado "<em>**REGISTRE-SE**</em>" e será redirecionado para uma página contendo as informações necessárias para que o cadastro no PrestAqui seja efetuado.

As telas chamadas "<em>**Customer Registration**</em>" possuem as informações onde o cliente precisará obrigatoriamente preencher. Sendo que, para prosseguir na tela seguinte, o cliente precisará inserir todas as informações solicitadas.

![image](https://github.com/user-attachments/assets/7b1c0eda-60f8-4cd8-9a84-2fd42208cb90)

Supondo que ele tenha concluído o cadastro, então ele retornará para a tela anterior, onde poderá efetuar o login na aplicação.

Uma vez que ele tenha efetuado o login, ele será levado para o painel principal da aplicação.

O painel principal conterá todas os agendamentos que ele possui e que estejam nos seguintes status:

- **Em aberto**: O agendamento já passou pela aprovação do prestador de serviços e está em aberto, aguardando a data marcada.
- **Aguardando validação**: O cliente efetou a abertura do agendamento, porém o prestador não aprovou o agendamento ainda.

![image](https://github.com/user-attachments/assets/1cbeb5de-bdea-44f6-bb8c-76bba17939d7)

**OBS**: Somente os clientes poderão criar agendamentos e somente o prestador terá a permissão para confirmá-los.

O cliente poderá cancelar o agendamento e também remarcá-lo. Sendo que, feito o reagendamento, o prestador precisará confirmá-lo para que, de fato, o reagendamento ocorra.

Além disso , o cliente também poderá visualizar o histórico dos agendamentos que já foram concluídos ou cancelados. Para isso, basta clicar em "<em>**HISTÓRICO**</em>".

![image](https://github.com/user-attachments/assets/feca4446-1d74-41f4-8f64-0ff11371e9f9)

Também será possível fazer o logout da aplicação, clicando em "<em>**SAIR**</em>", bem como criar um "**NOVO AGENDAMENTO**":

![image](https://github.com/user-attachments/assets/f8eaf5c9-42f6-4aee-8163-e38ef7569038)

**Supondo que o cliente opte por criar um novo agendamento:**

1. Primeiro, será disponibilizada uma tela contendo os filtros de pesquisa para que o cliente possa localizar o prestador que melhor atenda suas necessidades e demandas. Para facilitar a busca, ele poderá estabelecer alguns filtros para auxiliá-lo na escolha: Categoria, estado e cidade.

Feita essa escolha, ele também poderá acionar o Whatsapp do prestador e agendar o horário que melhor atenda as necesidades. 

Posteriormente, clicará em "<em>**AGENDAR VISITA**</em>":


![image](https://github.com/user-attachments/assets/2ee2fab2-0974-4850-8984-11ef0e48242e)


2. Na tela seguinte, a próxima etapa será inserir algumas informações importantes, tais como:
  - Título do serviço;
  - Descrição;
  - Informações do dia e horário;

 
3. Preenchidas as informações, o agendamento será criado e automaticamente possuirá o status de "<em>**AGUARDANDO VALIDAÇÃO**</em>".

![image](https://github.com/user-attachments/assets/ace8a1aa-4d7a-4bd2-865e-2fa1c74fae5d)


4. Também é importante salientar que, o usuário poderá redefinir sua senha, porém ainda estamos desenvolvendo está tela.
   
</details>



<details>
  <summary> Fluxo do prestador de serviço 🔗 </summary>

<br>
O fluxo do prestador é bem semelhante com o do cliente, por isso é recomendado que você primeiro veja o fluxo do cliente e depois retorne aqui.

As maiores diferenças estarão na página principal, onde o prestador visualizará todos os seus agendamentos e poderá aplicar as seguintes ações:
- Confirmar o serviço;
- Reagendar o serviço;
- Cancelar o serviço

Também destacamos que o prestador é o único que poderá CONFIRMAR o serviço.

![image](https://github.com/user-attachments/assets/8d13153e-2dbd-41e2-8a02-30093cd96d1e)

Ele também poderá visualizar os históricos dos agendamentos:

![image](https://github.com/user-attachments/assets/d472d3b7-ce4f-4f81-8bb7-76c4af30b106)

Por fim, tanto o **PRESTADOR DE SERVIÇOS**, quanto o CLIENTE poderão alterar o agendamento para **CONCLUÍDO**.
  
</details>

## Features 

## Tecnologias utilizadas 💻

## Instalação

## Autores 🙋‍♂️

