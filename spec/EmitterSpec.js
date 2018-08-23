var em = require("../lib/aps/Emitter.js");
var Emitter = em.Emitter;

describe("Emitter.emitTimerAt", function() {
    var e; // emitter;

    beforeEach(function() {
		e = new Emitter({
            gx: 0,
            gy: 0,
            interval: 1 / 30,
            activePeriod: 1,
            delayEmit: 0,
            numParticlesPerEmit: 1,
            maxParticles: 50,
            children: [],
            randomFunc: function() { return Math.random(); },
            initParam: {
                tx: [0],
                ty: [0],
                v: [0],
                a: [0],
                angle: [0],
                rz: [0],
                vrz: [0],
                arz: [0],
                lifespan: [100]
            },
            userData: null
        });
    });

	it("should emit once at 0 [sec]", function() {
        e.emitTimerAt(0, 1 / 30, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should emit once at interval [sec] with interval delta time", function() {
        e.emitTimerAt(e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should emit when stepping over emit key time", function() {
        e.emitTimerAt(e.interval * 1.5, e.interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should delay emitting by delayEmit", function() {
        e.delayEmit = e.interval * 1.5;

        e.emitTimerAt(0, e.interval, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(e.interval * 1.5, e.interval, 0, 0);
        expect(e.particles.length).toBe(1);

        e.emitTimerAt(e.interval * 1.5 + e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(2);
    });

    it("should not emit when current time doesn't reach next interval", function() {
        e.emitTimerAt(e.interval * 1.5, e.interval * 0.5, 0, 0);
        expect(e.particles.length).toBe(0);
    });

    it("should emit correctly even if time step is smaller than interval (slow-motion)", function() {
        var dt = e.interval * 0.03;
        var t = 0;
        while (t < 1.0) {
            e.emitTimerAt(t, dt, 0, 0);
            t += dt;
        }
        expect(e.particles.length).toBe(1.0 / e.interval | 0);
    });

    it("should emit each time when time step is larger than interval", function() {
        var dt = e.interval * 2.4;
        var t = 0;
        while (t < 1.0) {
            e.emitTimerAt(t, dt, 0, 0);
            t += dt;
        }
        expect(e.particles.length).toBe(Math.ceil(1.0 / dt));
    });

    it("should not emit when active period is expired", function() {
        e.emitTimerAt(e.activePeriod, e.interval, 0, 0);
        expect(e.particles.length).toBe(0);
    });
});
