## Guion de Presentación — Desarrollo Back-End

 

Capa de Controladores: Microservicios, Documentación de APIs y Librerías Esenciales

 

## Bloque 1 — Tema 3.3.3: Creación de microservicios

 

Guion de palabras sugeridas "Buenos días / tardes a todos. Continuando con la capa de controladores en el desarrollo back-end, abordaré el tema 3.3.3: Creación de microservicios.

 

Para entender los microservicios, debemos compararlos con la arquitectura monolítica. En un monolito, todos los procesos están estrechamente acoplados y se ejecutan como un solo servicio, lo que provoca que ante un aumento de demanda haya que escalar toda la aplicación.

 

Por el contrario, con una arquitectura de microservicios, la aplicación se descompone en componentes independientes creados para capacidades empresariales específicas, donde cada servicio realiza una sola función y se comunica mediante APIs ligeras e interfaces bien definidas.

 

Destaco dos características fundamentales:"

 

1 Autónomos: Cada servicio se puede desarrollar, desplegar, operar y escalar de forma independiente sin compartir código con otros servicios. 2 Especializados: Están diseñados para resolver un problema específico; si el código de un servicio se vuelve complejo, se puede subdividir en microservicios más pequeños. "Entre sus beneficios clave, destacan:"

 

• Escalado flexible: Podemos escalar de forma individual únicamente el microservicio que experimente alta demanda. • Agilidad y velocidad: Fomenta equipos pequeños que trabajan de forma independiente, reduciendo los tiempos del ciclo de desarrollo. • Resiliencia: Si ocurre un fallo en un servicio específico, la aplicación degrada esa función en particular sin provocar un colapso total de todo el sistema. • Implementación sencilla y libertad tecnológica: Facilita la entrega continua y la elección de la mejor herramienta o lenguaje para cada tarea. "En la práctica, para crear e integrar microservicios en el back-end nos apoyamos en infraestructuras de contenedores o ejecuciones sin servidor, API Gateways para gestionar el tráfico de peticiones, sistemas de mensajería y colas para la comunicación asíncrona, y bases de datos independientes (relacionales o NoSQL)."

 

Ejemplos reales para ilustrar el tema (puedes mencionarlos en vivo) Netflix: es el caso de estudio más citado. Migró de una arquitectura monolítica a más de 500 microservicios independientes; hoy servicios como el de recomendaciones, el de facturación y el de streaming se despliegan y escalan por separado, lo que le permite manejar picos de tráfico global sin caer toda la plataforma. Amazon: cada equipo es dueño de un microservicio pequeño (ej. carrito de compras, catálogo, pagos, envíos) que expone su propia API interna. Esto ilustra perfectamente el principio de 'autonomía': un equipo puede desplegar cambios en 'pagos' sin tocar el servicio de 'catálogo'.

 

Uber: comenzó como un monolito y, al escalar a cientos de ciudades, lo dividió en microservicios como el de geolocalización, el de tarifas dinámicas y el de asignación de conductores. Es un buen ejemplo de 'escalado flexible': en horas pico solo se escala el servicio de asignación, no toda la app.

 

Stack técnico de ejemplo: contenedores con Docker orquestados por Kubernetes; un API Gateway como Kong o AWS API Gateway para enrutar peticiones; RabbitMQ o Apache Kafka como sistema de mensajería asíncrona entre servicios; y cada microservicio con su propia base de datos (por ejemplo, PostgreSQL para el servicio de pedidos y MongoDB para el servicio de catálogo de productos).

 

Puntos clave de apoyo para tu diapositiva

 

Aspecto Monolito Microservicios

 

Estructura Un solo servicio acoplado Componentes independientes

 

Escalado Se escala toda la app Se escala solo el servicio necesario

 

Ejemplo real Netflix (versión inicial, 2008) Netflix actual (500+ microservicios) • Propiedades: Autónomos y especializados. • Ventajas: Escalabilidad independiente, resiliencia a fallos y entrega continua. • Componentes de creación: APIs ligeras, contenedores, colas de mensajería y almacenamiento propio.

 

## Bloque 2 — Tema 3.3.4: Documentación efectiva y librerías esenciales

 

## para back-end

 

Guion de palabras sugeridas "Pasando al punto 3.3.4: Documentación efectiva y librerías esenciales para back-end, analizaremos las herramientas requeridas para mantener la calidad y sostenibilidad del código en el servidor.

 

En primer lugar, la documentación efectiva es un pilar fundamental al trabajar con APIs REST y microservicios. Al estar desacoplados los componentes del servidor y del cliente, una documentación clara mediante contratos de API bien definidos permite coordinar la comunicación entre sistemas independientes. Plataformas y herramientas como los API Gateways ayudan en esta tarea gestionando el tráfico, el control de acceso y el versionamiento de las APIs.

 

En segundo lugar, respecto a las librerías y herramientas esenciales para el back-end, todo desarrollo robusto se apoya en tres tipos principales de soluciones:"

 

1 Marcos de trabajo (Frameworks) y SDKs: Uso de frameworks de desarrollo como Spring Boot para Java o ASP.NET Core, complementados con SDKs para lenguajes populares como Node.js, Python o Go. 2 Seguridad y Control de Acceso: Componentes enfocados en autenticación, autorización y seguridad en las APIs para proteger los controladores. 3 Registro y Supervisión (Logging y Monitoreo): Librerías y servicios para recopilar archivos de registro, dar seguimiento a métricas de rendimiento e inspeccionar el comportamiento de las peticiones que atraviesan los controladores. "En conclusión, combinar la creación de microservicios bien delimitados con una documentación estandarizada y el uso de librerías esenciales garantiza una arquitectura back-end escalable, segura y mantenible."

 

Ejemplos reales para ilustrar el tema (puedes mencionarlos en vivo) Documentación con OpenAPI/Swagger: empresas como Stripe y Twilio son referencia mundial por su documentación de API: cada endpoint incluye ejemplos de petición y respuesta en varios lenguajes, códigos de error explicados y un 'playground' interactivo generado a partir de la especificación OpenAPI (Swagger), que es el estándar de facto para documentar APIs REST.

 

Frameworks y SDKs en la práctica: un banco digital puede construir su API de transacciones con Spring Boot (Java) para el core bancario y exponer un SDK oficial en Node.js y Python para que otros desarrolladores integren pagos fácilmente, similar a como lo hace PayPal o Mercado Pago con sus SDKs oficiales.

 

Seguridad y control de acceso: el uso de OAuth 2.0 y JSON Web Tokens (JWT) para autenticar peticiones, tal como lo implementan Google y Auth0, permite que un API Gateway rechace automáticamente cualquier petición sin un token válido antes de que llegue al controlador.

 

Logging y monitoreo: plataformas como Netflix y Spotify usan el stack ELK (Elasticsearch, Logstash, Kibana) o herramientas como Prometheus + Grafana y Datadog para visualizar en tiempo real cuántas peticiones llegan a cada microservicio, cuáles fallan y cuánto tiempo tardan en responder, lo que permite detectar cuellos de botella antes de que afecten al usuario final. Puntos clave de apoyo para tu diapositiva • Documentación efectiva: Contratos de API estandarizados (ej. OpenAPI/Swagger), documentación de versiones y gestión de contratos entre cliente y servidor. • Librerías de Frameworks y SDKs: Apoyo en Spring Boot, ASP.NET Core y SDKs en lenguajes como Node.js, Java, Python o Go. • Librerías de seguridad: Autenticación (OAuth 2.0, JWT), autorización y protección de endpoints en la capa de controladores. • Monitoreo y Logging: Herramientas como ELK, Prometheus/Grafana o Datadog para registro de eventos, análisis de trazabilidad y métricas de rendimiento.
