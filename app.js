const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const express = require('express');
const router = express.Router();
const path = __dirname + '/views/';
const port = 8080;
const multer = require('multer');
const cloudinary = require('cloudinary').v2;


// Configurar Cloudinary (debes configurar estos valores con tus propias credenciales)
cloudinary.config({
    cloud_name: 'dbb56iwkk',
    api_key: '291373567894594',
    api_secret: 'tj-TiNgvXrhsLPpoDky_ZAZezdI'
});

const upload = multer({ dest: 'uploads/' }); // Carpeta temporal para almacenar archivos subidos


router.use(function (req, res, next) {
    console.log('/' + req.method);
    next();
});

router.get('/', function (req, res) {
    res.sendFile(path + 'index.html');
});

// Ruta para subir el archivo de audio y el mensaje
app.post('/upload-audio', upload.single('audio'), (req, res) => {
    // Verificar si hay un archivo adjunto
    if (!req.file) {
        return res.status(400).send('No se ha proporcionado ningún archivo de audio.');
    }

    // Subir archivo de audio a Cloudinary
    cloudinary.uploader.upload(req.file.path, { resource_type: "auto" },
        (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error al cargar el archivo de audio a Cloudinary.');
            }
            // Devolver la URL del archivo de audio subido junto con el mensaje
            const response = {
                audio_url: result.secure_url,
                message: req.body.message
            };
            res.status(200).json(response);
        }
    );
});

app.post('/', (req, res) => {

    res.send('Archivo recibido exitosamente');
});

app.use(express.static(path));
app.use('/', router);

const removeItem = function (object, key, value) {
    if (value == undefined)
        return;

    for (var i in object) {
        if (object[i][key] == value) {
            object.splice(i, 1);
        }
    }
};

const users = [];
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('send-nickname', function (nickname) {
        socket.nickname = nickname;
        var _t = {
            id: socket.id,
            nickname: socket.nickname
        }
        users.push(_t);
        io.emit('users-list', users);
    });

    socket.on('event-typing', function (data) {
        if (data) {
            io.emit('event-typing', data);
        }
    });

    socket.on('chat-message', function (data) {
        io.emit('chat-message', data);
    });

    socket.on('chat-file', function (fileInfo) {
        io.emit('chat-file', fileInfo);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        removeItem(users, 'id', socket.id);
        io.emit('users-list', users);
    });
});

http.listen(port, function () {
    console.log('Example app listening on port ' + port + '!')
});
