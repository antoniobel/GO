# Guiñote Olympic
**Guiñote Olympic** es una aplicación Web para jugar al juego de cartas el Guiñote. Guiñote Olympic es un juego para cuatro jugadores conectados por Internet.

**Guiñote Olympic** está formado por una aplicación corriendo en un servidor, que tiene ciertos requisitos técnicos que se explican más adelante, y una aplicación cliente corriendo en el sistema de cada jugador. Los únicos requisitos para la aplicación cliente son disponer de un navegador Web, como Firefox, Chrome, Edge, o cualquier otro y una conexión a Internet.   

## Características de Guiñote Olympic
- Servidor multipartida: El servidor puede atender un número indeterminado de partidas simultáneamente, solo limitaod por las características físicas del servidor y su conexión a Internet.
- Las partidas de Guiñote Olympic pueden admitir opcionalmente espectadores. Los espectadores no participan en la partida, pero pueden ver las cartas de algunos o todos los jugadores. La posibilidad de admitir espectadores se establece al crear la partida. 
- El servidor impide movimientos ilegales. (Renuncions en el arrastre).
- Los jugadores pueden reconectarse a la partida, en caso de problemas de conexión a la red o de otro tipo.
- Una partida, o coto, se juego a un número prefijado de victorias. Este número (frecuentemente 3) se establece al comienzo de la partida.
- El jugador que inicia la partida selecciona las parejas de juego. El resto de personas conectadas a la partida pasan a ser espectadores (Si la partida los admite).
- El programa cliente se adapta al tamaño de la pantalla mostrando imágenes claras y de una resolución adecuada.
- Los movimientos de las cartas (al repartid, jugar, recoger cartas, etc.) son suaves y fluidos. En caso de sistemas con pocos recursos gráficos, los movimientos se pueden suprimir.
- La aplicación cliente no está optimizada para dispositivos móviles, aunque es utilizable.
## Características Técnicas
### Servidor
El servidor está escrito en [Typescript](https://www.typescriptlang.org/index.html) y corre sobre [Node.js](https://nodejs.org/en/). La comunicación entre el servidor y los clientes utiliza [Colyseus](https://colyseus.io/). Para el servicio de páginas estáticas se usa [Express](https://expressjs.com/es/). Opcionalmente el servidor puede ejecutarse en un contenedor [Docker](https://docs.docker.com/).
### Cliente
El programa Cliente está escrito en [Typescript](https://www.typescriptlang.org/index.html) y se ejecuta en cualquier navegador con soporte estandar de Javascript y HTML5. Utiliza HTML y CSS para las partes estáticas. Los gráficos están programados directamente sobre el elemento [Canvas](https://developer.mozilla.org/es/docs/Glossary/Canvas) (HTML5). Se utiliza [Webpack](https://webpack.js.org/) para empaquetar los programas cliente. 

### Desarrollo del programa
Para el desarrollo de Guiñote Olympic se ha utilizado [Visual Studio Code](https://code.visualstudio.com/) como [IDE](https://es.wikipedia.org/wiki/Entorno_de_desarrollo_integrado) y [Git](https://git-scm.com/) como [sistema de control de versiones](https://es.wikipedia.org/wiki/Control_de_versiones).

## Prueba Guiñote Olympic
Puedes probar Guiñote Olympic en [http://go.abelp.net/gomp.html]. Sin embargo, este es mi servidor para uso personal, dispone de unos recursos limitados, y no puedo garantizar su disponibilidad. Si funciona, puedes usarlo, pero si tienes intención de jugar de forma regular te recomiendo que instales tu propio servidor, tal como se indica a continuación. Es sencillo.
## Galería de imágenes
![Diálogo de conexión. Identificación.](/assets/P1.png)
Diálogo de conexión. Identificación

![Diálogo de conexión. Creación partida.](/assets/P2.png)
Diálogo de conexión. Creación de la partida.

![Diálogo de conexión. Creación parejas y comienzo.](/assets/P3.png)
Diálogo de conexión. Creación de parejas y comienzo de la partida.

![Diálogo de conexión. Unirse a una partida.](/assets/P4.png)
Diálogo de conexión. Unirse a una partida.

![Area de juego.](/assets/P5.png)
Area de juego.

![Cantan 20.](/assets/P6.png)
Cantan 20.

![La partida ha terminado.](/assets/P7.png)
La partida ha terminado.

![La partida ha terminado.](/assets/P8.png)
La partida ha terminado.

![La partida de vueltas.](/assets/P9.png)
La partida de vueltas.

![Un jugador se desconecta.](/assets/P10.png)
Un jugador se desconecta.

![Un jugador se reconecta.](/assets/P11.png)
Un jugador se reconecta.

## Cómo usar la aplicación cliente
El uso de la aplicación cliente, desde el navegador, es muy sencillo e intuitivo. Se accede mediante: http://*dirección_del_servidor*/gomp.html

### El diálogo de conexión
Inicialmente se muestra un diálogo donde el jugdor se identifica y selecciona si quiere crear una partida o unirse a una partida ya existente.

Si se quiere crear una partida se indica el nombre de la misma y una vez creada el jugador queda en espera de que se conecten el resto de jugadores. El creador de la partida también indica cuantas victorias se necesitan para ganar la partida o coto y si la partida admitirá o no espectadores.

Si se quiere unir a una partida ya existente se selecciona el nombre de la partida a l que se quiere unir y el jugador queda en espera de que se conecten el resto de los jugadores o de que el jugador que creó la partida la comience.

Una vez que hay cuatro jugadores el creador de la partida puede seleccionar las parejas, seleccionandolas por nombre de jugador. Una vez las parejas están confeccionadas la partida puede comenzar, pulsando el botón Comenzar partida.

### El juego
Cuando comienza la partida cada jugador ve, en la parte inferior de la pantalla sus propias cartas, en la parte de arriba las cartas de su compañero y a los lados las cartas de la pareja contraria, convenientemente cubiertas todas, excepto las propias. A un lado de las cartas de cada jugador está su nombre y una pequeño indicador luminoso. Si el indicador está en rojo el jugador no tiene el turno de juego. Si el indicador parpadea en verde, es tu turno de juego.

Para jugar una carta se pulsa la carta elegida haciendo click en ella. Se oye un sonido y si la carta es válida sale hacia delante y la ven todos los jugadores. Si la carta no es válida (Si estamos en el arrastre) se oye un sonido distinto y la carta no sale. Una vez jugada la carta, el turno pasa al siguiente jugador. Cuando han jugado todos se indica el ganador de la baza y las cartas se recogen.

### Los botones
En la parte inferior derecha de la pantalla hay tres botones:
- Ordenar: Este botón ordena las cartas por palos dejando las cartas de triunfo a la izquierda. Si se quiere que las cartas de triunfo queden a la derecha hay que pulsar la tecla de mayúsculas a la vez que se pulsa el botón ordenar. El botón se puede pulsar en cualquier momento.
- Cambiar 7: Este botón está normalmente deshabilitado y sólo se puede pulsar cuando el jugador tiene el siete de triunfo y lo puede cambiar por la carta que marca el triunfo. En la ronda de juego número 4 (última ronda en que se toma una carta del mazo) ,si el botón está activo, el siete se cambia automáticamente aunque el jugador no pulse el botón. 
- Cantar: El botón se habilita cuando el jugador tiene un cante y es posible cantarlo. Cuando se pulsa el botón se cantan todos los cantes que tenga ese jugador. Los cantes nunca se producen automáticamente: El jugador debe pulsar siempre el botón para cantarlos.

Adicionalmente, en la parte superior derecha de la pantalla hay otro botón, Salir. Si se pulsa este botón se finaliza la partida inmediatamente y todos los jugadores se desconectan del servidor.

Cuando la partida finaliza se indica el resultado y el marcador hasta el momento. Se juegan las partidas de vuelta, si es necesario hasta que una pareja alcanza el número de victorias establecido para ganar el juego. Cuando el juego finaliza se muestra el resultado y la partida termina. Todos los jugadores se desconectan del servidor.

### Atajos de teclado
Adicionalmente se pueden usar las siguientes combinaciones de teclas:
- **Ctrl + X**: Solicita una actualización de los contenidos de la pantalla. Normalmente no es necesario usarlo.
- **Ctrl + A**: Suprime o reanuda los movimientos de las cartas.
- **Alt + N**: Llama al camarero.
- **Alt + D**: Suprime o activa el modo debug. 

### Los espectadores
Si la partida admite espectadores todos aquellos que se han conectado a la partida y no han sido incluidos en las dos parejas de juego se convierten automáticamente en espectadores. Los espectadores ven un tapete de juego igual al de los jugadores y ven las jugadas igual que los jugadores. Cuando se inicia la partida ven las cartas de todos los jugadores boca abajo, pero haciendo click en cualquier carta de cualquier jugador, ponen boca arriba las cartas de ese jugador. 
## Guiñote Olympic con una sola partida
Si utilizas tu servidor privado de Guiñote Olympic para jugar una sola partida cada vez existe un procedimiento de conexión simplificado que acorta el diálogo de conexión y hace que todos los jugadores se conecten a la misma partida. Se accede con la URL **http://*dirección_del_servidor*/go.html**. Solo cambia el diálogo de conexión inicial, que es el siguiente: 

![Diálogo inicial para una sola partida.](/assets/P12.png)
Diálogo inicial para una sola partida.

No es necesario indica ningún nombre de partida y una vez conectado, cualquier jugador puede iniciar la partida. Una vez iniciada la partida el juego es exactamente el mismo.

## Problemas más frecuentes
Guiñote Olympic ha sido probado de forma bastante extensa y en su estado actual no presenta problemas conocidos. No obstante, en ocasiones se presentan situaciones problemáticas, algunas de las cuales se describen a continuación:
- Los indicadores luminosos de los cuatro jugadores están en rojo: Guiñote Olympic tiene un mecanismo de sincronización entre los jugadores. Después de que un jugador juega una carta, el servidor notifica a todos los jugadores la carta que se ha jugado y todos los programas clientes envían una confirmación de que se ha recibido el mensaje. Si el servidor no da paso al siguiente jugador es porque le falta la confirmación de alguno de los jugadores, bien debido a que alguno se ha desconectado o bien porque temporalmente no contesta. Si ocurre ésto último, normalmente la situación se recupera por si sóla. 
- Los cuatro jugadores han jugado sus cartas, que están en el tapete, pero éstas no se recogen: Exactamente la misma causa que la indicada anteriormente.
- Pulso en una carta, pero esta no sale: En primer lugar asegúrate de que es tu turno. Si el indicativo luminoso no parpadea en verde no tienes el turno, aunque pienses lo contrario. Si es tu turno, puede indicar un problema de conexión: Cuando el jugador pulsa una carta, ésta se envia al servidor y éste la valida. Si es una carta válida el servidor contesta y el programa cliente muestra la carta en la pantalla. Si no se muestra es debido a un problema temporal, normalmente, o permanente de conexión de ese jugador.
- Intento jugar una carta en el arrastre, se oye un ruido extraño y la carta no sale: El ruido extraño indica que estás jugando una carta inválida. ¡El servidor no deja jugar un renuncio!. Prueba con otra carta.

Para los problemas de conexión se recomienda desconectarse y volver a conectarse. Para desconectar se puede usar F5 en el navegador, que reinicia el programa del cliente. También se puede cerrar la pestaña del navegador o el navegador completo y reconectarse a la partida siguiendo el procedimiento de conexión habitual.

## Instalación
La instalación del servidor Guiñote Olympic es relativamente sencilla, aunque es necesario instalar software adicional, en particular Node.js. No importa cual sea el Sistema Operativo que use el servidor. 
- [Descarga e instala Node.js](https://nodejs.org/en/download/) en tu sistema.
- Clona el [repositorio de Guiñote Olympic](https://github.com/antoniobel/go.git) en Github.
- Desde una ventana de comandos (Powershell en Windows o cualquier shell en Linux) accede al directorio donde se ha clonado la instalación desde Github:

        cd ruta_proyecto/Guiñote
- Instala todos los paquetes y módulos necesarios con:

        npm install
- Compila y empaqueta la aplicación cliente con:

        npx webpack --config ./client/webpack.configPROD.js

Si todo ha funcionado correctamente, el servidor está en condiciones de arrancar con el comando:

        ts-node guinoteserver.ts

Cuando el servidor se inicia correctamente emite el mensaje:

        Guiñote server escuchando en http://localhost:3000

Una vez que aparece este mensaje, el servidor admite conexiones en el puerto 3000. Abre un navegador web y accede a la página inicial: [http://localhost:3000/gomp.html](http://localhost:3000/gomp.html).

### Instalación con Docker
Para ejecutar el servidor de Guiñote Olympic en un contenedor Docker sigue los siguientes pasos (Después de ejecutar el npm install y npx webpack):
- [Instala Docker](https://docs.docker.com/get-docker/) en tu sistema.
- Desde el directorio del proyecto crea la imagen docker con el siguiente comando:

        docker build -t go.server .

Donde go.server es el nombre del contenedor que vas a crear. Puede ser cualquier nombre.
- Crea y lanza el contenedor con el comando:
        
        docker run -ti --name go.server -p 3000:3000 -d go.server

## Licencia
[GPL v3](https://www.gnu.org/licenses/gpl-3.0.html)
## Breve historia de Guiñote Olympic
**Guiñote Olympic** es hija del COVID-19. Tras la declaración del estado de alarma en España el 14 de Marzo de 2020 y el consiguiente confinamiento de la población, nuestras partidas de Guiñote del viernes por la tarde, quedaron repentinamente suspendidas. 

Pero a la vez, comenzó la búsqueda de soluciones alternativas. Alguien sugirió que buscáramos una alternativa por internet (en lugar del teletrabajo, nosotros somos partidarios del telejuego). Yo había desarrollado en tiempos una versión del Guiñote en Java, que tenía una opción multijugador. En el desarrollo me había centrado en la parte de IA, es decir, en que el programa jugará razonablemente bien contra un humano, y la parte multijugador había sido un añadido posterior. El programa funcionaba bien en una red local, con tiempos de latencia bajos, pero por internet, hacía aguas por todos los lados.

Encontramos una aplicación en internet que permitía el juego entre cuatro personas. Pero tenía algunos inconvenientes. Uno es que somos siete, cuatro juegan y tres miran (pero no callan). Con la aplicación, los cuatro jugaban, pero los otros tres no veían nada. Y lo que es peor, a veces el juego echaba de la partida a algún jugador o jugaba por él, si tardaba demasiado en jugar (a veces, incluso pensamos).

Por eso, me encontré pensando en desarrollar una alternativa propia. El objetivo era un juego que se pudiera jugar desde un navegador (sin tener que instalar nada), que permitiera a unos jugar y a otros ver, y que tuviera paciencia con los que piensan y con los que tienen malas conexiones.

El resultado es **Guiñote Olympic**. El camino comenzó descubriendo que [Node.js](https://nodejs.org/en/) podía ser el entorno ideal para este tipo de problemas, continuó descubriendo alguien ya había pensado en casi todos los problemas que había que resolver para hacer un juego (cualquier juego) y había escrito [Colyseus](https://colyseus.io/) y que existía un lenguaje de programación, Javascript, que yo conocía, un poco, pero más bien poco, que daba soporte a todo esto.

En tres o cuatro semanas, había un versión inicial que comenzamos a probar, el equipo habitual, con aciertos y algunos errores. Aunque la secuencia de juego ha funcionado siempre bien (estaba, en cierta forma inspirada en el juego que desarrollé en Java) el factor de la red como un elemento extraño entre el servidor y los clientes añade complejidad y dificulta la localización de los errores. 

Con paciencia y tiempo, del que la pandemia nos ha proporcionado cantidades abundantes, el programa ha ido mejorando, añadiendo funcionalidades, mejorando la programación, incluyendo el cambio de Javascript a Typescript (que tiene un agradable regustillo a Java) y otras mejoras técnicas importantes.

Y cada viernes, Angel, Antonio, Jesús, José Luis, Juanra, Rafa y un servidor hemos probado con entusiasmo el juego, 
hemos maldecido cuando el servidor se caía, se atascaba o cuando la otra pareja cantaba las cuarenta, aunque cada vez se caía y se atascaba menos, aunque ellos, malditos, seguían cantando las cuarenta...

El resultado final es el que aquí tienes. Espero que disfrutes tanto como yo he disfrutado programando, y jugando.

Antonio Bel, Junio 2020.