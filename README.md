# Huertas TIC Colombianas - LMS estático (demo)

Descripción
---
Plataforma LMS demostrativa, sin backend, usando HTML/CSS/JS y JSON + LocalStorage. Diseñada para funcionar en GitHub Pages.

Estructura
---
- index.html
- login.html
- dashboard.html
- curso.html
- plantar.html
- css/
- js/
- json/
- assets/

Despliegue en GitHub Pages
---
1. Crea un repositorio y sube todo el contenido.
2. En Settings > Pages, configura la rama `main` y la carpeta `/ (root)` para publicar.
3. Accede a https://<tu-usuario>.github.io/<tu-repo>/index.html

Agregar/editar usuarios
---
Edita `json/users.json`. Cada objeto debe tener: id, username, password, role, name.

Notas de seguridad
---
Este proyecto es una demo. Las contraseñas en texto plano y la ausencia de backend no son seguros para producción. Úsalo como prototipo educativo.

Próximos pasos sugeridos
---
- Añadir editor de contenidos para profesor (editar JSON desde UI).
- Simular subida de archivos guardando en LocalStorage (base64).
- Implementar examen con preguntas desde JSON y temporizador.
- Mejorar accesibilidad y pruebas en móviles.
