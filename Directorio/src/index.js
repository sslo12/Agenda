const express = require('express'); //se indica que se requiere express
const app = express(); // se inicia express y se instancia en una constante de nombre app.
const morgan = require('morgan'); //se indica que se requiere morgan
const mysql = require('mysql2/promise');
// settings
app.set('port', 3000); //se define el puerto en el cual va a funcionar el servidor

// Utilities
app.use(morgan('dev')); //se indica que se va a usar morgan en modo dev
app.use(express.json()); //se indica que se va a usar la funcionalidad para manejo de json de express

// Conexión a la base de datos
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'almacen'
});
// Rutas para usuarios
app.get('/usuarios', async (req, res) => {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM usuarios');
    conn.release();
    res.json(rows);
});
app.get('/usuarios/:id', async (req, res) => {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    conn.release();
    if (rows.length === 0) return res.status(404).send('Usuario no encontrado');
    res.json(rows[0]);
});
app.get('/usuarios/:usuario/:password', async (req, res) => {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM usuarios WHERE usuario = ? AND password = ?',[req.params.usuario, req.params.password]);
    conn.release();
    if (rows.length === 0) return res.status(404).send('Usuario no encontrado');
    res.json(rows[0]);
});
app.post('/usuarios', async (req, res) => {
    const conn = await pool.getConnection();
    const [result] = await conn.query('INSERT INTO usuarios VALUES (null, ?, ?, ?)', [req.body.nombre, req.body.usuario, req.body.password]);
    const [rows] = await conn.query('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
    conn.release();
    res.json(rows[0]);
});
app.put('/usuarios/:id', async (req, res) => {
    const conn = await pool.getConnection();
    const [result] = await conn.query('UPDATE usuarios SET nombre=?, usuario =?, password =? WHERE id =? ', [req.body.nombre, req.body.usuario, req.body.password, req.params.id]);
    const [rows] = await conn.query('SELECT * FROM usuarios WHERE id = ?',[req.params.id]);
    conn.release();
    res.json(rows[0]);
});
app.delete('/usuarios/:id', async (req, res) => {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('DELETE FROM usuarios WHERE id = ?',[req.params.id]);
    conn.release();
    res.send("usuario borrado");
});


// Iniciar el servidor
app.listen(app.get('port'), () => {
    console.log("Servidor funcionando");
}); //se inicia el servidor en el puerto definido y se pone un mensaje en la consola









------------------
    
    //

// Ruta para mostrar las rutinas creadas
app.get('/rutinas', (req, res) => {
    connection.query('SELECT * FROM rutinas', (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Ruta para mostrar una rutina seleccionada por un cliente
app.get('/rutinas/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM rutinas WHERE id = ?', [id], (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

// Ruta para marcar una rutina como terminada y generar una notificación
app.post('/rutinas/:id/terminar', (req, res) => {
    const id = req.params.id;
    const { username, nuevoPeso } = req.body;

    connection.query('UPDATE rutinas SET terminadas = 1 WHERE id = ?', [id], (error, results) => {
        if (error) throw error;
        connection.query('INSERT INTO notificaciones (username, rutina, nuevo_peso, fecha) VALUES (?, ?, ?, ?)', [username, id, nuevoPeso, new Date()], (error, results, fields) => {
            if (error) throw error;
            res.send('Rutina terminada y notificación generada');
        });
    });
});

// Ruta para mostrar las notificaciones de rutinas terminada para los entrenadores
app.get('/notificationes', (req, res) => {
    // Verificar si el usuario tiene permiso de entrenador
    if (req.session.user.role !== 'entrenador') {
        res.status(403).send('No tienes permiso para acceder a esta página');
        return;
    }
    // Obtener las notificaciones de rutinas terminadas
    connection.query('SELECT * FROM notificationes', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al obtener las notificaciones');
            return;
        }
        res.render('notificationes', { notificationes: results });
    });
});

// Ruta para crear usuarios para la aplicación para los usuarios entrenadores
app.post('/usuarios', (req, res) => {
    // Verificar si el usuario tiene permiso de entrenador
    if (req.session.user.role !== 'entrenador') {
        res.status(403).send('No tienes permiso para acceder a esta página');
        return;
    }
    const { nombre, peso, meta, username, password, rol } = req.body;
    // Verificar que los campos requeridos estén presentes
    if (!nombre || !peso || !meta || !username || !password || !rol) {
        res.status(400).send('Faltan campos requeridos');
        return;
    }
    // Verificar que el usuario no exista previamente
    connection.query('SELECT * FROM usuarios WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al verificar el usuario');
            return;
        }

        if (results.length > 0) {
            res.status(409).send('El usuario ya existe');
            return;
        }
        // Crear el usuario
        connection.query('INSERT INTO username (nombre, peso, meta, username, password, role) VALUES (?, ?, ?, ?, ?, ?)', [nombre, peso, meta, username, password, rol], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error al crear el usuario');
                return;
            }
            res.status(201).send('Usuario creado exitosamente');
        });
    });
});

// Ruta para crear una nueva rutina
app.post('/rutinas', (req, res) => {
    const { descripcion, aumentar_reducir, kilos_ganados_perdidos } = req.body;

    // Insertar nueva rutina en la base de datos
    pool.query('INSERT INTO rutinas (descripcion, aumentar_reducir, kilos_ganados_perdidos) VALUES (?, ?, ?)', [descripcion, aumentar_reducir, kilos_ganados_perdidos], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error al crear la rutina');
        } else {
            // Obtener el ID de la nueva rutina
            const rutinaId = results.insertId;

            // Enviar una respuesta con el ID de la nueva rutina
            res.status(201).json({ id: rutinaId });
        }
    });
});
