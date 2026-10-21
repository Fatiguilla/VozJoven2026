LA VOZ JOVEN — VERSIÓN 4: SECCIONES, FOTOGRAFÍAS Y PANEL DE REDACCIÓN

ARCHIVOS PRINCIPALES
- index.html: portada con las publicaciones más recientes.
- educacion.html, salud.html, cultura.html, investigacion.html, etc.: página independiente de cada sección.
- admin.html: panel de redacción con contraseña de demostración.
- articulo.html: lectura de la noticia completa y su galería.
- newsroom.js: funciones comunes para listar noticias y mostrarlas en cada página.
- styles.css: estilos del sitio.

PROBAR EN TU COMPUTADORA
1. Descomprime la carpeta.
2. Abre index.html en el navegador.
3. Entra a una sección y pulsa “Publicar noticia”, o usa el botón “Publicar” del menú.
4. Contraseña de demostración: VozJoven2026
5. Completa titular, sección, fecha, autor, resumen, fotografía principal, imágenes adicionales y contenido.
6. Pulsa “Publicar noticia”. La noticia aparecerá en su sección, en la portada y en su propia página de lectura.

LIMITACIONES IMPORTANTES
Esta es una demostración estática. Las noticias e imágenes se guardan en localStorage del navegador en el que se publican, no en un servidor; por tanto, no se comparten automáticamente con otros lectores ni dispositivos. El navegador tiene un límite de almacenamiento y por eso cada imagen está limitada a 1,2 MB.
La contraseña está en JavaScript y puede verse inspeccionando el código: NO es seguridad real. Antes de poner el periódico en internet se necesita un backend con autenticación segura, base de datos compartida y almacenamiento de imágenes en servidor/nube. Entonces los periodistas podrán publicar desde cualquier dispositivo y todos los lectores verán las mismas noticias.
