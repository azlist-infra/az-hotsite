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


    Alpine.data('cadastro', () => ({

        pax: {
            Name: '',
            Email: '',
            Phone: '',
            Cpf: '',
        },

        token: null,

        init() {

            const url = new URL(window.location.href);
            const id = url.searchParams.get('id')
            this.token = url.searchParams.get('token');

            fetch(`https://api-rds-aztools.onrender.com/api/magic-link/${id}?token=${this.token}`, {
                method: 'GET',
            }).then(async (res) => {
                const data = await res.json();

                this.pax = data.pax;
            })
        },

        async submit () {

            const response = await fetch(`https://api-rds-aztools.onrender.com/api/putMagicLink/${this.pax.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({
                    Name: this.pax.Name,
                    Cpf: this.pax.Cpf.replace(/\D+/g, ''),
                    Phone: this.pax.Phone.replace(/\D/g, ''),
                    Email: this.pax.Email,
                    Token: this.token
                }),
            })

            if (response.status === 200) {
                alert('Seus dados foram atualizados com sucesso!')
            }
        }

    }))
})

