let cnv;
let video;
let poseNet;
let poses = [];
let prevPoses = [];
// let prevFace;
// let prevPose;

var myAsciiArt;
var asciiart_width = 80;
var asciiart_height = 50;
/*
Buffer for processed graphics, simplifying some operations. This will be an
object derived from the p5.Graphics class
*/
var gfx;
let maxFontSize;
let xRescale;
let yRescale;
let mic;

var isMic = true;
var asciiartOn = true;
var showOryginalImageFlag = true;
let mirror = true;
let invertVideo = false;
let invertAsciiart = false;
let lerpAmount = 0.3;

// FTT
let spectrum;
let waveform;

// Worms
let worms = [];
let maxWorms = 30;
let spawnRate = 4; // seconds
let newWorm = false;

function setup() {
    cnv = createCanvas(1280, 960);
    cnv.parent("#sketch");
    // cnv.class("center");

    video = createCapture(VIDEO);
    video.hide();
    video.size(640, 480);
    video.elt.setAttribute("playsinline", "");
    setRescaling();

    // ASCII art
    myAsciiArt = new AsciiArt(this);
    textAlign(CENTER, CENTER);
    // textFont('monospace', 8);
    textStyle(NORMAL);
    gfx = createGraphics(asciiart_width, asciiart_height);
    gfx.pixelDensity(1);
    maxFontSize = sqrt(pow(width / asciiart_width, 2) + pow(height / asciiart_height, 2)) * 0.75;
    // Create an Audio input
    if (isMic) {
        mic = new p5.AudioIn();
        mic.start();
    }

    // ML5
    poseNet = ml5.poseNet(video, "multiple", modelReady);
    poseNet.on("pose", gotPoses);
    strokeCap(ROUND);
    // blendMode(DIFFERENCE); // trippy
    // blendMode(HARD_LIGHT); // nice darkened colors

    // FTT
    fft = new p5.FFT(0.8, 512);
    fft.setInput(mic);
}

function setRescaling() {
    xRescale = width / video.width;
    yRescale = height / video.height;
}

function gotPoses(results) {
    poses = results;
}

function modelReady() {
    console.log("model ready");
}

function draw() {
    background(0);
    if (xRescale > 999999 || yRescale > 999999) {
        setRescaling();
    }

    spectrum = fft.analyze();
    // waveform = fft.waveform();

    if (mirror) {
        translate(width, 0);
        scale(-1.0, 1.0); // flip x-axis backwards
    }

    if (showOryginalImageFlag) {
        image(video, 0, 0, width, height);
        if (invertVideo) filter(INVERT);
    }

    if (asciiartOn) drawAscii();

    if (poses != undefined && poses.length > 0) {
        drawPoses();
        handleWorms();
    } else {
        showWorms();
    }
}

function handleWorms() {
    // spawn new if applicable
    if (second() % spawnRate == 0 && worms.length < maxWorms && !newWorm) {
        worms.push(new Worm(createVector(random(width), -50)));
        newWorm = true;
    } else if (second() % spawnRate != 0) {
        newWorm = false;
    }

    var pose = poses[0].pose;
    var nose = createVector(pose.keypoints[0].position.x * xRescale, pose.keypoints[0].position.y * yRescale);
    // move towards mouth TODO

    // remove worms which reached target
    for (var i = worms.length - 1; i >= 0; i--) {
        if (p5.Vector.dist(worms[i].pos, nose) < 20) {
            worms.splice(i, 1);
        }
    }

    // let the bass amplitude (bin 80 / 512) affect the max speed of worms
    // var maxSpeedFactor = map(spectrum[30], 0, 255, 0.5, 10);
    // console.log(maxSpeedFactor);

    // apply seek function, update and show worms
    for (var i = 0; i < worms.length; i++) {
        // worms[i].maxspeed = worms[i].maxspeed0 * maxSpeedFactor;
        worms[i].seek(nose);
        worms[i].update();
        worms[i].show();
    }
}

function showWorms() {
    for (var i = 0; i < worms.length; i++) {
        worms[i].show();
    }
}

function drawPoses() {
    for (var j = 0; j < poses.length; j++) {
        let pose = poses[j];
        let prevPose = prevPoses[j];

        // face
        let nose = createVector(pose.pose.keypoints[0].position.x, pose.pose.keypoints[0].position.y);
        let el = createVector(pose.pose.keypoints[1].position.x, pose.pose.keypoints[1].position.y);
        let er = createVector(pose.pose.keypoints[2].position.x, pose.pose.keypoints[2].position.y);

        if (prevPose != undefined) {
            // get position of previous nose and eyes
            let prevNose = createVector(prevPose.pose.keypoints[0].position.x, prevPose.pose.keypoints[0].position.y);
            let prevEl = createVector(prevPose.pose.keypoints[1].position.x, prevPose.pose.keypoints[1].position.y);
            let prevEr = createVector(prevPose.pose.keypoints[2].position.x, prevPose.pose.keypoints[2].position.y);
            // lerp between old and new position
            nose = p5.Vector.lerp(nose, prevNose, lerpAmount);
            el = p5.Vector.lerp(el, prevEl, lerpAmount);
            er = p5.Vector.lerp(er, prevEr, lerpAmount);
        }

        let btwEyes = p5.Vector.sub(el, er);
        let d = p5.Vector.dist(nose, el);

        // lerp from previous skeleton
        if (prevPose != undefined && prevPose.skeleton.length == pose.skeleton.length) {
            for (var i = 0; i < prevPose.skeleton.length; i++) {
                pose.skeleton[i][0].position.x = lerp(pose.skeleton[i][0].position.x, prevPose.skeleton[i][0].position.x, lerpAmount);
                pose.skeleton[i][0].position.y = lerp(pose.skeleton[i][0].position.y, prevPose.skeleton[i][0].position.y, lerpAmount);
                pose.skeleton[i][1].position.x = lerp(pose.skeleton[i][1].position.x, prevPose.skeleton[i][1].position.x, lerpAmount);
                pose.skeleton[i][1].position.y = lerp(pose.skeleton[i][1].position.y, prevPose.skeleton[i][1].position.y, lerpAmount);
            }
        }

        stroke(255);
        strokeWeight(d / 2);
        for (var i = 0; i < pose.skeleton.length; i++) {
            line(
                pose.skeleton[i][0].position.x * xRescale,
                pose.skeleton[i][0].position.y * yRescale,
                pose.skeleton[i][1].position.x * xRescale,
                pose.skeleton[i][1].position.y * yRescale
            );
        }

        // circle ovr head
        if (d * 10 < 600) {
            fill(0, 80);
            push();
            translate(nose.x * xRescale, nose.y * yRescale - d);
            rotate(btwEyes.heading());
            if (isMic) {
                ellipse(0, 0, d * 8 * map(mic.getLevel(), 0, 1, 1, 0.6), d * 10 * map(mic.getLevel(), 0, 1, 1, 1.5));
            } else {
                ellipse(0, 0, d * 8, d * 10);
            }
            pop();
        }

        // black crosses on the eyes
        stroke(0);
        strokeWeight(d * 0.6);
        // left eye
        drawCross(el.x * xRescale, el.y * yRescale, btwEyes);
        // right eye
        drawCross(er.x * xRescale, er.y * yRescale, btwEyes);

        prevPoses[j] = pose;
    }
}

function drawAscii() {
    noStroke();
    fill(invertVideo ? 0 : 255);
    // draw some ASCII art
    gfx.background(0);
    gfx.image(video, 0, 0, gfx.width, gfx.height);
    /*
    It is worth experimenting with the value of the parameter defining the
    level of posterization. Depending on the characteristics of the image,
    different values may have the best effect. And sometimes it is worth not
    to apply the effect of posterization on the image.
    */
    // let posterize = map(mouseY, 50, height, 2, 60);
    // posterize = constrain(posterize, 2, 60);
    // gfx.filter(POSTERIZE, posterize);
    gfx.filter(POSTERIZE, 10);
    if (invertAsciiart) gfx.filter(INVERT);
    // textFont('monospace', map(mic.getLevel(), 0, 1, 4, 20));

    // textFont('monospace', map(mouseX, 0, width, 2, maxFontSize));
    textFont("Courier", maxFontSize);
    ascii_arr = myAsciiArt.convert(gfx);
    myAsciiArt.typeArray2d(ascii_arr, this);
}

function drawCross(x, y, btwEyes) {
    let l = btwEyes.mag() * 0.8;
    let eyeAngle = btwEyes.heading();
    push();
    translate(x, y);
    rotate(-PI / 4 + eyeAngle);
    line(-l, 0, l, 0);
    rotate(PI / 2 + eyeAngle);
    line(-l, 0, l, 0);
    pop();
}

function mouseReleased() {
    invertVideo = !invertVideo;
}
