document.addEventListener('alpine:init', () => {

    const BASE_API = 'https://api-rds-aztools.onrender.com/api'
    // const BASE_API = 'http://localhost:3005/api'

    Alpine.data('cadastro', () => ({

        pax: {
            Name: '',
            Email: '',
            Phone: '',
            Cpf: '',

            // nome completo agora salvando no CityState
            CityState: '',
            // Isso aqui é o caminho da imagem :eyes:
            Nationality: null,
        },

        token: null,
        loading: true,

        isCpfDisabled: false,

        message: {
            text: null,
            type: null
        },

        uploadPreview: null,

        blob: null,

        sending: false,

        dropingFile:false,

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

                this.isCpfDisabled = !!this.pax.Cpf

                if (data.pax.Nationality) {

                    const v = +new Date;

                    this.uploadPreview = `https://azlist-content.s3.amazonaws.com/${data.pax.Nationality}?v=${v}`
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

            /**
             * @var {HTMLCanvasElement}
             */
            const canvas = Object.assign(document.createElement('canvas'), {
                width: 800,
            })

            const ctx = canvas.getContext('2d')

            const img = Object.assign(document.createElement('img'), {
                src: URL.createObjectURL(file)
            });

            const drawAfterLoad = () => {
                const w = canvas.width;
                const h = canvas.width *  img.height / img.width;

                canvas.height = h;

                ctx.drawImage(img, 0, 0, w, h);

                canvas.toBlob((blob) => {
                    this.blob = blob;
                    this.uploadPreview = URL.createObjectURL(blob)
                }, 'image/jpeg', 0.8)

            }

            img.complete ? drawAfterLoad() : img.addEventListener('load', drawAfterLoad)

            console.log(canvas)
        },

        async submit() {

            if (! this.isCpfDisabled && !this.pax.Cpf) {
                this.setMessage('É necessário informar o CPF', 'danger');
                return
            } 


            if (['Phone', 'Name'].some(k => !this.pax[k])) {
                this.setMessage('Preencha todos os campos para continuar.', 'danger');
                return;
            }

            if (!this.pax.Nationality && !this.blob) {
                this.setMessage('O envio de uma imagem é obrigatório.', 'danger');
                return;
            }


            this.sending = true;

            const response = await fetch(`${BASE_API}/putMagicLink/${this.pax.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Token ${this.token}`
                },
                body: JSON.stringify({
                    Name: this.pax.Name,
                    Cpf: this.isCpfDisabled ?  undefined : this.pax.Cpf.replace(/\D+/g, ''),
                    Phone: this.pax.Phone.replace(/\D/g, ''),
                    Email: this.pax.Email,
                    CityState: this.pax.CityState,
                    Nationality: this.pax.Nationality
                    
                }),
            })

            await this.uploadPhoto()

            this.sending = false;

            this.setMessage('Suas informações foram atualizadas com sucesso!')
        },

        async uploadPhoto() {

            if (this.blob === null) return;

            const form = new FormData()

            form.append('photo', this.blob, this.blob.name);

            await fetch(`${BASE_API}/postMagicLinkUploadPhoto/${this.pax.id}`, {
                method: 'POST',
                body: form,
                headers: {
                    authorization: `Token ${this.token}`
                }
            })

            this.blob = null;
        },

        onDrop (e) {
            const file = e.dataTransfer.files[0];

            this.selectImage(file)
        }

    }))
})