var em = require("../lib/aps/Emitter.js");
var Emitter = em.Emitter;

describe("Emitter.emitTimerAt", function() {
    var e; // emitter;

    beforeEach(function() {
		e = new Emitter({
            gx: 0,
            gy: 0,
            interval: 1 / 30,
            activePeriod: 30,
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

	it("should emit every interval", function() {
        e.emitTimerAt(0, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(e.interval, 0, 0);
        expect(e.particles.length).toBe(2);
        e.emitTimerAt(e.interval * 1.5, 0, 0);
        expect(e.particles.length).toBe(2);
        e.emitTimerAt(e.interval * 2, 0, 0);
        expect(e.particles.length).toBe(3);
    });

    it("should not emit when active period is expired", function() {
        e.emitTimerAt(e.activePeriod, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(e.activePeriod - em.TOLERANCE,  0, 0);
        expect(e.particles.length).toBe(0);
    });

    it("should emit only after delayEmit", function() {
        e.delayEmit = e.interval * 123; // delayEmitはintervalの整数倍という制限に従って設定
        e.emitTimerAt(0, 0, 0);
        expect(e.particles.length).toBe(0);
        e.emitTimerAt(e.delayEmit, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(e.delayEmit + e.interval, 0, 0);
        expect(e.particles.length).toBe(2);
    });
});
