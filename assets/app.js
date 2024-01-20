document.addEventListener('alpine:init', () => {

    let x = 1;
    function gerarAgenda() {
        return {
            titulo: `Dia ${x++}`,
            texto: 'Descrição da Agenda desse dia'
        }
    }

    Alpine.data('agenda', () => ({
        items: [
            gerarAgenda(),
            gerarAgenda(),
            gerarAgenda(),
            gerarAgenda(),
            gerarAgenda(),
            gerarAgenda()
        ]
    }))
})

