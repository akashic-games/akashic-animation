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

	it("should emit once at 0 [sec] with 0 delta time", function() {
        e.emitTimerAt(0, 0, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(0, 0, 0, 0);
        expect(e.particles.length).toBe(2);
    });

	it("should emit once at 0 [sec] with interval delta time", function() {
        e.emitTimerAt(0, e.interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

	it("should emit once at interval [sec] with 0 delta time", function() {
        e.emitTimerAt(e.interval, 0, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should emit once at interval [sec] with interval delta time", function() {
        e.emitTimerAt(e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should not emit at interval * 1.5 [sec] with interval * 0.5 delta time", function() {
        e.emitTimerAt(e.interval * 1.5, e.interval * 0.5, 0, 0);
        expect(e.particles.length).toBe(0);
    });

    it("should emit once at interval * 1.5 [sec] with interval delta time", function() {
        e.emitTimerAt(e.interval * 1.5, e.interval, 0, 0);
        expect(e.particles.length).toBe(1);
    });

    it("should not emit when active period is expired", function() {
        e.emitTimerAt(e.activePeriod, 0, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(e.activePeriod, e.interval, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(e.activePeriod + e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(e.activePeriod + e.interval, e.interval * 2, 0, 0);
        expect(e.particles.length).toBe(0);
    });

    it("should emit when active period is expired but delta time is enough long", function() {
        e.emitTimerAt(e.activePeriod, e.interval * 1.5, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(e.activePeriod, e.interval * 2, 0, 0);
        expect(e.particles.length).toBe(2);
        e.emitTimerAt(e.activePeriod, e.interval * 2.5, 0, 0);
        expect(e.particles.length).toBe(4);
    });

    it("should not emit before delayEmit", function() {
        e.delayEmit = 1.0;
        e.emitTimerAt(0, 0, 0, 0);
        expect(e.particles.length).toBe(0);
        e.emitTimerAt(e.delayEmit, 0, 0, 0);
        expect(e.particles.length).toBe(1);
        e.emitTimerAt(e.delayEmit, e.interval, 0, 0);
        expect(e.particles.length).toBe(2);
        e.emitTimerAt(e.delayEmit, e.interval * 100, 0, 0);
        expect(e.particles.length).toBe(3);
        e.emitTimerAt(e.delayEmit + e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(4);
        e.emitTimerAt(e.delayEmit + e.interval, e.interval * 100, 0, 0);
        expect(e.particles.length).toBe(6);
    });

    it("can emit correctly around MAX_ACTIVEPERIOD", function() {
        // e.activePeriod = em.MAX_ACTIVEPERIOD に同じ
        e.activePeriod = -1;

        // em.MAX_ACTIVEPERIOD を整数化する。
        // interval = 1 / 30 なので時刻MAX_ACTIVEPERIODは
        // エミットタイミングに一致する
        em.MAX_ACTIVEPERIOD |= 0;

        // 活動期間を満了しておりemitしない
        e.emitTimerAt(em.MAX_ACTIVEPERIOD, 0, 0, 0);
        expect(e.particles.length).toBe(0);

        // emitタイミングの 1 interval 前の時刻でemitする
        e.emitTimerAt(em.MAX_ACTIVEPERIOD - e.interval, 0, 0, 0);
        expect(e.particles.length).toBe(1);

        // emitタイミングの 1 interval 前の時刻でemitする
        e.emitTimerAt(em.MAX_ACTIVEPERIOD - e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(2);

        // 活動満了時刻から遡って 2 interval 時間の間に1度emitする
        e.emitTimerAt(em.MAX_ACTIVEPERIOD, e.interval + e.interval, 0, 0);
        expect(e.particles.length).toBe(3);

        // 活動満了時刻から遡って 3 interval 時間の間に2度emitする
        e.emitTimerAt(em.MAX_ACTIVEPERIOD, e.interval + e.interval + e.interval, 0, 0);
        expect(e.particles.length).toBe(5);

        // 以下 em.MAX_ACTIVEPERIOD の許容誤差ギリギリの時刻においても同様に動作することを確認する

        e.reset();

        e.emitTimerAt(em.MAX_ACTIVEPERIOD - em.TOLERANCE, 0, 0, 0);
        expect(e.particles.length).toBe(0);

        e.emitTimerAt(em.MAX_ACTIVEPERIOD - em.TOLERANCE - e.interval, 0, 0, 0);
        expect(e.particles.length).toBe(1);

        e.emitTimerAt(em.MAX_ACTIVEPERIOD - em.TOLERANCE - e.interval, e.interval, 0, 0);
        expect(e.particles.length).toBe(2);

        e.emitTimerAt(em.MAX_ACTIVEPERIOD - em.TOLERANCE, e.interval + e.interval, 0, 0);
        expect(e.particles.length).toBe(3);

        e.emitTimerAt(em.MAX_ACTIVEPERIOD - em.TOLERANCE, e.interval + e.interval + e.interval, 0, 0);
        expect(e.particles.length).toBe(5);
    });

});
