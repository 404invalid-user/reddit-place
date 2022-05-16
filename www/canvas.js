var socket;
var canvastag = document.getElementById("zoomMe");
var pp = canvastag.getContext("2d");
var colourstag = document.querySelector('.colours');
var placeBtn = document.getElementById("place-btn");

var container = document.querySelector("body");

var me = {}
var cacheusers = [];
var colours = [];
var canvasBlocks = [];
var countDownDate;
var active = false;
var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;
var touchScalling = [];
var scale = 1;
   var mobileschalingstart = {distance: 0,x:0,y:0}

window.onload = async() => {
    fetch('/api/activeusers').then(res => res.json()).then(json => {
        document.getElementById('onlinec').innerText = json.users;
    }).catch(err => {
        console.log(err.stack || err)
    });
    setInterval(function() {
        fetch('/api/activeusers').then(res => res.json()).then(json => {
            document.getElementById('onlinec').innerText = json.users;
        }).catch(err => {
            console.log(err.stack || err)
        });
    }, 30000)

    await fetch('/api/me').then(res => res.json()).then(json => {
        me = json;
    }).catch(err => {
        console.log(err.stack || err)
    });


    if (me.admin) {
        document.querySelector('.admin-menu').innerHTML = `
        <p>admin menu</p>
        <label for="user">User: <a id="username">none</a></label>
        <input id="user" type="text"/>
        <button onclick="adminMenuBanUser()" class="btn-red-hov">Ban User</button>
        <br>
        <label for="timeout">Time out</label>
        <input id="timeout" type="text" value="3"/>
        <button onclick="adminMenuEditUseTimeOut()">Update timeout</button>
        <label for="additionalcolours">additional colours</label>
        <input id="additionalcolours" type="checkbox"/>
        <button onclick="adminMenuUpadeAdditionalColours()">Update additional colours</button>
        `;
    }

    async function adminMenuUpdate(block) {
        if (!me.admin) return;
        var userfromcache = cacheusers.filter(u => u.id == block.user);
        if (userfromcache.length <= 0) {
            await fetch('/admin/userlookup?id=' + block.user).then(res => res.json()).then(json => {
                if (json.id != '1') {
                    cacheusers.push(json);
                }
            }).catch(err => {
                console.log(err.stack || err)
            });
        }
        userfromcache = cacheusers.filter(u => u.id == block.user);
        if (userfromcache.length <= 0) return;
        document.getElementById('username').innerText = userfromcache[0].username;
        document.getElementById('user').value = userfromcache[0].id;
        document.getElementById('timeout').value = userfromcache[0].placeTimeOut;
        document.getElementById('additionalcolours').checked = userfromcache[0].additionalColours;
    }

    function adminMenuBanUser() {

    }

    function adminMenuEditUseTimeOut() {

    }

    function adminMenuUpadeAdditionalColours() {

    }

    socket = io('', {
        auth: {
            id: getCookie('id'),
            token: getCookie('token')
        }
    });

    //fetch data
    await fetch('/api/colours').then(res => res.json()).then(json => {
        colours = json;
    }).catch(err => {
        console.log(err.stack || err);
    });

    let coloursContent = '';
    for await (const colour of colours) {
        if (colour.additional) {
            if (me.additionalColours) {
                coloursContent += `<div class="colour additional" id="colour-${colour.id}" style="background-color:${colour.value}"></div>`;
            }
        } else {
            coloursContent += `<div class="colour" id="colour-${colour.id}" style="background-color:${colour.value}"></div>`;
        }
    }
    colourstag.innerHTML = coloursContent;
    //reset dis after adding each colour from api
    var eachColourBox = document.querySelectorAll('.colour');
    for (var x = 0; x < eachColourBox.length; x++) {
        if (eachColourBox[x].id.replace("colour-", '') == me.last.selected.colour) {
            eachColourBox[x].classList.add('selected');
        }

        eachColourBox[x].addEventListener('click', async(event) => {
            for (const colour of colours) {
                if (colour.id == event.target.id.replace("colour-", '')) {
                    var selecteds = document.getElementsByClassName("selected");
                    for await (const selectedcls of selecteds) {
                        if (selectedcls.id !== event.target.id) {
                            selectedcls.classList.remove("selected");
                        }
                    }
                    me.last.selected.colour = colour.id;
                    socket.emit('select', me.last.selected);
                    event.target.classList.add('selected');
                };
            }
        });
    };


    await fetch('/api/blocks').then(res => res.json()).then(json => {
        canvasBlocks = json;
    }).catch(err => {
        console.log(err.stack || err)
    });

    await canvasSetup();
    await canvasSelectBox(me.last.selected.x, me.last.selected.y);
    placeBtn.addEventListener('click', place);
    // Set the date we're counting down to


    //start place time lock
    countDownDate = new Date(me.last.placeDate + (me.placeTimeOut * 60000)).getTime();
    // Update the count down every 1 second
    var x = setInterval(function() {
        // Get today's date and time
        var now = new Date().getTime();
        // Find the distance between now and the count down date
        var distance = countDownDate - now;
        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Output the result in an element with id="demo"
        placeBtn.innerHTML = hours + ":" + minutes + ":" + seconds + "";

        placeBtn.classList.add('cant-place');
        // If the count down is over, write some text 
        if (distance < 0) {
            if (placeBtn.innerHTML.toString().toLowerCase() !== 'place') {
                placeBtn.innerHTML = "Place";
            }
            placeBtn.classList.remove('cant-place');
        }
    }, 1000);

    socket.on("connect_error", (err) => {
        console.log(err instanceof Error); // true
        console.log(err.message); // not authorized
        console.log(err.data); // { content: "Please retry later" }
    });

    socket.on('update-user', function(data) {
        me = data;
        countDownDate = new Date(me.last.placeDate + (me.placeTimeOut * 60000)).getTime();
    });
    //go to login page if told
    socket.on('login', function(data) {
        window.location.href = '/login';
    });


    function canvasMakeBox(x, y, colour) {
        pp.beginPath();
        pp.fillStyle = colour;
        pp.strokeStyle = colour;
        //pp.strokeRect(x, y, 5, 5);
        //pp.rect(x, y, 5, 5);
        pp.clearRect(x, y, 5, 5);
        pp.strokeStyle = 'black';
        pp.fillRect(x, y, 5, 5);
        pp.stroke();
    };

    function place(event) {
        if (me.last.placeDate > Date.now() + (me.placeTimeOut * 60000)) return;
        placeBtn.classList.add('cant-place');
        socket.emit('place', me.last.selected);
    }

    function roundDown5(x) {
        return Math.ceil(x / 5) / 5;
    }

    function round5(n) {
        return Math.round(n / 5) * 5;
    }

    function canvasSelectBox(x, y) {
        let trueX = round5(x);
        let trueY = round5(y);
        let blcColour = '';
        for (let bloc of canvasBlocks) {
            if (bloc.x == trueX && bloc.y == trueY) {
                blcColour = bloc.colour;
                adminMenuUpdate(bloc);
            }
            if (bloc.x == me.last.selected.x && bloc.y == me.last.selected.y) {
                canvasMakeBox(bloc.x, bloc.y, bloc.colour);
            }
        }

        me.last.selected.x = trueX;
        me.last.selected.y = trueY;
        if (me.id != '1') {
            socket.emit('select', { x: trueX, y: trueY, colour: me.last.selected.colour });
        }
        pp.beginPath();
        pp.lineWidth = 1;
        pp.fillStyle = 'black';
        pp.fillRect(trueX, trueY, 5, 5);
        pp.fillStyle = blcColour;
        pp.fillRect(parseFloat(trueX.toString() + '.5'), parseFloat(trueY.toString() + '.5'), 4, 4);
        pp.stroke();
    }



    function getMousePosition(event) {
        let rect = canvastag.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        let truex = x / scale
        let truey = y / scale
        return { x: truex, y: truey }
    }


    function canvasSetup() {
        canvastag.addEventListener('click', function(e) {
            const pos = getMousePosition(e);
            canvasSelectBox(pos.x, pos.y)
        }, false);

        var cx = 0;
        var cy = 0;
        for (const blk of canvasBlocks) {
            if (blk.x > cx) {
                cx = blk.x;
            }
            if (blk.y > cy) {
                cy = blk.y;
            }
        }
        canvastag.width = cx + 5;
        canvastag.height = cy + 5;
        for (const blk of canvasBlocks) {
            canvasMakeBox(blk.x, blk.y, blk.colour)
        }
    }

    socket.on('place-block', function(data) {
        updateBlockData(data.x, data.y, data.colour, data.user);
        canvasMakeBox(data.x, data.y, data.colour);
        if (data.x == me.last.selected.x && data.y == me.last.selected.y) canvasSelectBox(data.x, data.y);
    });



    function updateBlockData(x, y, colour, user) {
        for (let block of canvasBlocks) {
            if (block.x == x && block.y == y) {

                block.colour = colour;
                if (user) block.user = user;
            }
        }
    }


    container.addEventListener("touchstart", dragStart, { passive: false });
    container.addEventListener("touchend", dragEnd, { passive: false });
    container.addEventListener("touchmove", drag, { passive: false });

    container.addEventListener("mousedown", dragStart, { passive: false });
    container.addEventListener("mouseup", dragEnd, { passive: false });
    container.addEventListener("mousemove", drag, { passive: false });

 

    function dragStart(e) {
        if (e.type === "touchstart") {
            if (e.touches.length === 2) {

                e.preventDefault(); // Prevent page scroll
                // Calculate where the fingers have started on the X and Y axis
                mobileschalingstart.x = (e.touches[0].pageX + e.touches[1].pageX) / 2;
                mobileschalingstart.y = (e.touches[0].pageY + e.touches[1].pageY) / 2;
                mobileschalingstart.distance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            } else {

                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            }
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;


        }
        if (e.target === canvastag) {
            active = true;
        }
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    //reset everything
    active = false;
    touchScalling = [];
}

function scaleAt(cursorat, amount) { // at in screen coords
    scale *= amount;
    currentX = cursorat.x - (cursorat.x - currentX) * amount;
    currentY = cursorat.y - (cursorat.y - currentY) * amount;

    console.log("cale by: " + amount);
    console.log(cursorat)
    xOffset = currentX;
    yOffset = currentY;
    setPosition(currentX, currentY, canvastag);
}

function drag(e) {
    if (e.touches && e.touches.length === 2) {

        e.preventDefault(); // Prevent page scroll
        // Safari provides event.scale as two fingers move on the screen
        // For other browsers just calculate the scale manually
        let scaleing;
        if (e.scale) {
            scaleing = e.scale;
        } else {
            const deltaDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            scaleing = deltaDistance / mobileschalingstart.distance;
        }
        // Calculate how much the fingers have moved on the X and Y axis
        const deltaX = (((e.touches[0].pageX + e.touches[1].pageX) / 2) - mobileschalingstart.x) * 2; // x2 for accelarated movement
        const deltaY = (((e.touches[0].pageY + e.touches[1].pageY) / 2) - mobileschalingstart.y) * 2; // x2 for accelarated movement

        touchScalling.push(scaleing);

        //only start schaling whenwe have enough data
        if (touchScalling.length > 20) {
            //TODO: check gap between fingers and use that to scale
            if (touchScalling[0] < touchScalling[touchScalling.length - 1]) {
                scaleAt({ x: 0, y: 0 }, 1.1);
            } else {
                scaleAt({ x: 0, y: 0 }, 2 / 2.1);
            }

        }

    } else {
        if (active) {
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;
            setPosition(currentX, currentY, canvastag);
        }
    }
}

function setPosition(xPos, yPos, el) {
    //el.style.transform = "scale(7) translate3d(" + xPos + "px, " + yPos + "px, 0)";
    el.style.transform = `matrix(${scale},0,0,${scale},${xPos},${yPos})`;

}



document.addEventListener("wheel", (event) => {
    const x = event.pageX - (canvastag.width / 2);
    const y = event.pageY - (canvastag.height / 2);
    if (event.deltaY < 0) {
        scaleAt({ x, y }, 1.1);
    } else {
        scaleAt({ x, y }, 2 / 2.1);
    }
    event.preventDefault();
}, { passive: false });


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}