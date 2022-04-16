const express = require("express")
const app = express()
const bodyParser = require("body-parser") // iniciamos o modulo body-parser
const cors = require("cors") // tivemos que instalar o cors (npm install cors --save) e usa-lo para que consigamos acessar a nossa api, que 
// está no endereço https://localhost:6969 através de outro endereço (o endereço do index.html). Por padrão, o acesso a uma api atraves
// de outro endereço é bloqueada. Ativar o cors e usa-lo desbloqueia isso

const jwt = require("jsonwebtoken") // esse pacote foi instalado (npm install --save jsonwebtoken) para que façamos a autenticação do usuário
// e verifiquemos se ele tem acesso a utilizar a nossa api

const JWTSecret = "essaEhASenhaDeGeracaoDeTokensDaNossaAPINinguemPodeSabe-laApenasEu"


app.use(cors())

app.use(bodyParser.urlencoded({extended: false})) // essa linha faz com que os dados do cliente da api ( ou seja, a requisição), sejam enviados
                                                // através de um objeto javascript - json. O extended false é para evitar que utilizm de campos e
                                                // encadeados
app.use(bodyParser.json())


function auth_middleware(req, res, next){ // a req, antes de chegar na api, é capturada pelo middleware
    // o middleware só deixa a requisiçao chegar na api, se a função next() for chamada
    let authorization = req.headers["authorization"] // a autorização fica nessa variavel => "bearer" + token

    //console.log(authorization)

    if(authorization != undefined){

        let token = authorization.split(" ")[1] // authorization.split(" ")[0] == "bearer"
        // console.log(authorization.split(" "))

        jwt.verify(token, JWTSecret, (error, data)=>{   // essa função verifica se o token recebido é válido e se ainda não expirou
                                                        // o primeiro argumento é o token, o segundo é a chave da autenticação da api, que serve tanto pra criptografar quanto pra descriptografar, que é o caso
            if(error){
                res.status(400)
                res.json({error: "token inválido"})
            }
            else{
                req.token = token   // criei esses dois parametros na request, que podem ser acessados pelos metodos http, de forma que podemos contar quantos acessos uma api teve, quem acessou...
                req.usuario = {id: data.id, email: data.email}
                next()
            }
        })

    }
    else{
        res.status(400)
        res.json({"error": "autorização inválida"}) // ne vai pra api. Já retorna o erro
    }

}


var DB = { // esse aqui vai ser nosso banco de dados falso - como desafio, crie um verdadeiro com o sequelize

    guris:[
        {
            cpor: 145,
            nome: "Rumão",
            caracteristica: "orelhudo",

        },
        {
            cpor: 128,
            nome: "Masterchef",
            caracteristica: "calvo",

        },
        {
            cpor: 01,
            nome: "Ferroca",
            caracteristica: "shapado",

        },
        
    ],
    usuarios:[// esses sao os usuarios que possuem acesso a nossa api.
        {
            id: 1,
            nome: "kalil",
            email: "kalilgb152@gmail.com",
            senha: "minhaSenha"
        },
        {
            id: 2,
            nome: "Precila",
            email: "Precila@gmail.com",
            senha: "senhaDela"
        }
    ]

}

app.get("/guris", auth_middleware, function(req, res){           // Isso aqui é um endpoint, que é basicamente uma rota da nossa api
                                                // nós usamos o verbo get, pois vamos fazer uma consulta, uma leitura, vamos pegar dados
    res.statusCode = 200
    let resposta = {
        "USUÁRIO": req.usuario, // atributo da requisição criado dentro do middleware
        "GURIS": DB.guris
    }
    res.json(DB.guris/*resposta*/)
})

app.get("/guri/:cpor", auth_middleware, (req, res)=>{    // demorei um seculo pra descobrir que não coloquei a primeira barra do endereço

    if(isNaN(req.params.cpor)){
        res.statusCode = 400
        res.send("Erro 400: Bad request")
    }
    else{

        let cpor = parseInt(req.params.cpor)    // os parametros são enviados como strings

        let guri = DB.guris.find((guri) => guri.cpor == cpor)

        if(guri != undefined){
            res.statusCode = 200
            res.json(guri)
        }
        else{
            res.statusCode = 404
            res.send("Erro 404: not found")
        }

    }

})

// o método post é feito para ADICIONAR DADOS - VAMOS, ENTÃO - ADICIONAR GURI
// pode-se ter dois endpoints com o mesmo path, desde que os metodos sejam diferentes
// não é possivel chamar um metodo post pelo browser. devemos chama-lo pelo postman
app.post("/guri", auth_middleware, (req, res)=>{

    let {cpor, nome, caracteristica} = req.body // os dados de um formulario aparecerão no json req.body

    DB.guris.push({cpor: cpor, nome: nome, caracteristica:caracteristica})

    res.statusCode = 200

    res.send("OK")
})


app.delete("/guri/:cpor", auth_middleware, (req, res)=>{

    if(isNaN(req.params.cpor)){
        res.statusCode = 400
        res.send("Erro 400: Bad request, mermão")
    }
    else{

        let cpor = parseInt(req.params.cpor)    // os parametros são enviados como strings

        let indice = DB.guris.findIndex((guri) => guri.cpor == cpor)

        if(indice != -1){

            DB.guris.splice(indice, 1)

            res.statusCode = 200

            res.sendStatus(200)
            
        }
        else{
            res.statusCode = 404
            res.send("Erro 404: esse guri não foi encontrado")
        }

    }

})

app.put("/guri/:cpor", auth_middleware, (req, res)=>{

    if(isNaN(req.params.cpor)){
        res.statusCode = 400
        res.send("Erro 400: Bad request, mermão")
    }
    else{

        let cpor = parseInt(req.params.cpor)    // os parametros são enviados como strings

        let guri = DB.guris.find((guri) => guri.cpor == cpor)

        if(guri != undefined){

            let {cpor, nome, caracteristica} = req.body // NÃO CONFUNDA REQ.BODY COM REQ.JSON ----->

            if(cpor != undefined){
                guri.cpor = cpor
            }
            if(nome != undefined){
                guri.nome = nome
            }
            if(caracteristica != undefined){
                guri.caracteristica = caracteristica
            }


            res.statusCode = 200

            res.sendStatus(200)
            
        }
        else{
            res.statusCode = 404
            res.sendStatus(404)
        }

    }

})



app.post("/auth", (req, res)=>{
    
    let {email, senha} = req.body

    let usuario = DB.usuarios.find(usuario => usuario.email == email)

    if(usuario != undefined){

        if(usuario.senha == senha){ 

            jwt.sign({id: usuario.id, email:usuario.email}, JWTSecret, {expiresIn:"48h"}, (erro, token)=>{   // Essa linha gera e assina um token para a utilização da nossa
                if(erro){
                    res.status(400)
                    res.json({"erro": "falha interna"})
                }
                else{
                    res.status(200)
                    res.json({"token": token})
                }                                   //api. O primeiro parametro são os payloads, que são as informações que
                                                   // vão criptografadas dentro do codigo do token, o segundo é a chave para geração
                                                                        // do token, o terceiro é um json para definirmos o periodo de vida do token, e o quarto é um callback
                                                            //dessa função (jwt.sign), pois ela é assincrona, dado que trabalha com criptografia
            })
        }
        else{
            res.sendStatus(401)
            res.json({"erro": "senha inválida"})
        }

    }else{
        res.sendStatus(400)
        res.send("erro: email inválido")
    }

})


app.listen(6969, ()=>{
    console.log("API rodando!")
})