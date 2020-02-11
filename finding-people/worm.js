class Worm {
    constructor(_pos) {
        this.count = floor(random(4, 8));
        this.len0 = random(30, 80);
        this.segments = [];
        this.pos = _pos;
        this.head = new Segment(this.pos, this, this.len0);

        var next = this.head.getEnd();
        for (var i = 0; i < this.count; i++) {
            var newSeg = new Segment(next, this, this.head.len);
            this.segments.push(newSeg);
            next = newSeg.getEnd();
        }

        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxforce = random(0.1, 0.02);
        this.maxspeed0 = random(2, 5);
        this.maxspeed = this.maxspeed0;

        // colors
        this.strokeColor = color(random(10, 100), random(180, 255), random(0, 50));
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxspeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        this.head.update(this.pos.copy());

        var next = this.head.getEnd();
        for (var i = 0; i < this.count; i++) {
            this.segments[i].update(next);
            next = this.segments[i].getEnd();
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    // A method that calculates and applies a steering force towards a target
    // STEER = DESIRED MINUS VELOCITY
    seek(target) {
        var desired = p5.Vector.sub(target, this.pos); // A vector pointing from the position to the target

        // If the magnitude of desired equals 0, skip out of here
        // (We could optimize this to check if x and y are 0 to avoid mag() square root
        if (desired.mag() == 0) return;

        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        var steer = p5.Vector.sub(desired, this.vel);
        // steer.limit(this.maxforce);  // Limit to maximum steering force

        steer.limit(this.maxforce);
        this.applyForce(steer);
    }

    show() {
        fill(60, 200, 50);
        stroke(this.strokeColor);
        this.head.show();

        for (var i = 0; i < this.count; i++) {
            this.segments[i].show();
        }
    }
}

class Segment {
    constructor(pos_, worm_, len_) {
        this.worm = worm_;
        this.start = pos_.copy();
        // this.len = map(this.worm.segments.length, 0, this.worm.count, this.worm.len0, this.worm.len0/this.worm.count);
        this.len = len_*0.75;
        this.end = this.start.copy();
        this.end.add(this.len, 0);
        this.stroke = map(this.worm.segments.length, 0, this.worm.count, this.len*0.8, 1);
    }

    update(start_) {
        var seg1 = p5.Vector.sub(this.end, start_);

        seg1.setMag(this.len);
        this.end = p5.Vector.add(start_, seg1);
        this.start = start_.copy();
    }

    getEnd() {
        return this.end;
    }

    show() {
        strokeWeight(this.stroke);
        line(this.start.x, this.start.y, this.end.x, this.end.y);
        ellipse(this.start.x, this.start.y, this.stroke / 2);
    }
}
