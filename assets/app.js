document.addEventListener('alpine:init', () => {

    const BASE_API = 'https://api-rds-aztools.onrender.com/api'
    // const BASE_API = 'http://localhost:3005/api'

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
        loading: true,

        message: {
            text: null,
            type: null
        },

        uploadPreview: 'https://placehold.co/160x80',

        blob: null,

        uploading: false,

        setMessage(message, type = 'success', timeout = 6000) {
            this.message.text = message
            this.message.type = type
            setTimeout(() => {
                this.message.text = null;
                this.message.type = null;
            }, timeout);
        },
        init() {

            let id;
            let token;

            const url = new URL(window.location.href);

            if (url.searchParams.has('token')) {
                id = url.searchParams.get('id')
                token = url.searchParams.get('token')

                localStorage.setItem('id', id)
                localStorage.setItem('token', token)
            } else {
                id = localStorage.getItem('id')
                token = localStorage.getItem('token')
            }

            this.token = token;

            fetch(`${BASE_API}/magic-link/${id}`, {
                method: 'GET',
                headers: {
                    authorization: `Token ${this.token}`
                }
            }).then(async (res) => {

                const data = await res.json();

                this.pax = data.pax;

                this.loading = false;

                if (data.pax.SocialNetwork)
                {
                    this.uploadPreview = `https://azlist-content.s3.amazonaws.com/${data.pax.SocialNetwork}`
                }
            })
        },


        /**
         * 
         * @param {File} file 
         */
        selectImage(file) {

            if (!file) return;

            const extension = file.name.toLowerCase().split('.').slice(-1)[0]

            if (!['jpg', 'png', 'webp', 'jpeg'].includes(extension)) {
                this.setMessage('A imagem deve ser PNG, JPG ou WEBP', 'danger');
                return;
            }

            this.blob = file;
            this.uploadPreview = URL.createObjectURL(file);
        },

        async submit() {

            const response = await fetch(`${BASE_API}/putMagicLink/${this.pax.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Name: this.pax.Name,
                    Cpf: this.pax.Cpf.replace(/\D+/g, ''),
                    Phone: this.pax.Phone.replace(/\D/g, ''),
                    Email: this.pax.Email,
                }),
                headers: {
                    authorization: `Token ${this.token}`
                }
            })

            if (response.status === 200) {
                this.setMessage('Seus dados foram atualizados com sucesso!')
            }
        },

        async uploadPhoto() {

            if (this.blob === null) return;

            const form = new FormData()

            form.append('photo', this.blob, this.blob.name);

            this.uploading = true;

            await fetch(`${BASE_API}/postMagicLinkUploadPhoto/${this.pax.id}`, {
                method: 'POST',
                body: form,
                headers: {
                    authorization: `Token ${this.token}`
                }
            })
            .finally(() => {
                this.uploading = false
            })

            this.setMessage('Imagem enviada com sucesso!', 'success')

            this.blob = null;
        }

    }))
})