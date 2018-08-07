var em = require("../lib/aps/Emitter.js");
var Emitter = em.Emitter;

describe("Emitter.emitTimerAt", function() {
    var e; // emitter;
    var interval;
    var activePeriod;

    beforeEach(function() {
        interval = 1 / 30;
        activePeriod = 1;
		e = new Emitter({
            gx: 0,
            gy: 0,
            interval: interval,
            activePeriod: activePeriod,
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

	it("should emit once at 0 sec with 0 delta time", function() {
        e.start();
        e.emitTimerAt(0, 0, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(0, 0, 0, 0);
        expect(e.particles.length).toBe(2);
    });

	it("should emit once at interval[sec] with 0 delta time", function() {
        e.start();
        e.emitTimerAt(0, interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should emit once at interval [sec] with interval delta time", function() {
        e.start();
        e.emitTimerAt(interval, interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should not emit at interval * 1.5 [sec] with interval * 0.5 delta time", function() {
        e.start();
        e.emitTimerAt(interval * 1.5, interval * 0.5, 0, 0);
        expect(e.particles.length).toBe(0);
    });

    it("should emit once at interval * 1.5 [sec] with interval delta time", function() {
        e.start();
        e.emitTimerAt(interval * 1.5, interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should not emit when active period is expired", function() {
        e.start();
        e.emitTimerAt(activePeriod, 0, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(activePeriod, interval, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(activePeriod + interval, interval, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(activePeriod + interval, interval * 2, 0, 0);
        expect(e.particles.length).toBe(0);
    });

    it("should emit once when active period is expired but delta time is enough long", function() {
        e.start();
        e.emitTimerAt(activePeriod, interval * 1.5, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(activePeriod, interval * 2, 0, 0);
        expect(e.particles.length).toBe(2);
    });
});
