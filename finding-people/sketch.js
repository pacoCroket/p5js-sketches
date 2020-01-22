let video;
let poseNet;
let noseX = 0;
let noseY = 0;
let eyelX = 0;
let eyelY = 0;
let pose;

function setup() {
    createCanvas(windowWidth, windowHeight);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, modelReady);
    poseNet.on('pose', gotPoses);
}

function gotPoses(poses) {
    // console.log(poses);
    if (poses.length > 0) {
        pose = poses[0];
        let nX = poses[0].pose.keypoints[0].position.x;
        let nY = poses[0].pose.keypoints[0].position.y;
        let eX = poses[0].pose.keypoints[1].position.x;
        let eY = poses[0].pose.keypoints[1].position.y;
        noseX = lerp(noseX, nX, 0.5);
        noseY = lerp(noseY, nY, 0.5);
        eyelX = lerp(eyelX, eX, 0.5);
        eyelY = lerp(eyelY, eY, 0.5);
    }
}

function modelReady() {
    console.log('model ready');
}

function draw() {

    translate(width, 0);
    scale(-1.0, 1.0);    // flip x-axis backwards

    image(video, 0, 0);

    let d = dist(noseX, noseY, eyelX, eyelY);

    noFill();
    strokeWeight(5);
    stroke(0, 255, 120);
    ellipse(noseX, noseY, d*5);
    if (pose != undefined) {
        for (var i = 0; i < pose.pose.keypoints.length; i++) {
            ellipse(pose.pose.keypoints[i].position.x, pose.pose.keypoints[i].position.y, 20);
        }
        for (var i = 0; i < pose.skeleton.length; i++) {
            line(pose.skeleton[i][0].position.x, pose.skeleton[i][0].position.y, pose.skeleton[i][1].position.x, pose.skeleton[i][1].position.y);
        }
    }


}