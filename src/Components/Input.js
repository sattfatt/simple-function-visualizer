import { getSuggestedQuery } from "@testing-library/dom";
import { abs, isNumeric } from "mathjs";
import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable"
import "../Styles/Input.css"
import { on, trigger } from "../Utils/Events";
import mapRange from "../Utils/mapRange";
const math = require('mathjs');

function Input(props) {

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [range, setRange] = useState({ xmin: -1.0, xmax: 1.0, ymin: -1.0, ymax: 1.0 });
    const [parser, setParser] = useState(math.parser());
    const [parser2, setParser2] = useState(math.parser());
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [func, setFunction] = useState("x");
    const [grad, setGrad] = useState({ gx: 0, gy: 0 });

    const onDrag = (e, data) => {
        setPosition(getPos(data));
        const output = evaluate(getPos(data));
        trigger('input:evaluate', output);
    }


    const onXmin = (e) => {
        setRange({ xmin: Number(e.target.value), xmax: range.xmax, ymin: range.ymin, ymax: range.ymax });
    }
    const onXmax = (e) => {
        setRange({ xmin: range.xmin, xmax: Number(e.target.value), ymin: range.ymin, ymax: range.ymax });
    }
    const onYmin = (e) => {
        setRange({ xmin: range.xmin, xmax: range.xmax, ymin: Number(e.target.value), ymax: range.ymax });
    }
    const onYmax = (e) => {
        setRange({ xmin: range.xmin, xmax: range.xmax, ymin: range.ymin, ymax: Number(e.target.value) });
    }

    const getPos = (data) => {
        const w = containerRef.current.getBoundingClientRect().width;
        const h = containerRef.current.getBoundingClientRect().height;
        const winput = inputRef.current.getBoundingClientRect().width;
        const hinput = inputRef.current.getBoundingClientRect().height;

        const xini = data.x + winput / 2.0;
        const yini = data.y + hinput / 2.0;
        const xnorm = mapRange(xini, winput / 2, w - winput / 2, range.xmin, range.xmax);
        const ynorm = mapRange(yini, hinput / 2, h - hinput / 2, range.ymax, range.ymin);
        return { x: xnorm, y: ynorm };
    }

    const convert = (data) => {
        const cw = 400;
        const ch = 400;
        const ow = inputRef.current.getBoundingClientRect().width;
        const oh = inputRef.current.getBoundingClientRect().height;

        const xini = mapRange(data.x, range.xmin, range.xmax, ow / 2, cw - ow / 2);
        const yini = mapRange(data.y, range.ymax, range.ymin, oh / 2, ch - oh / 2);
        const x = xini
        const y = yini
        return { x: x, y: y };
    }

    const evaluate = (point) => {
        let x = 0;
        let y = 0;
        let gx = 0;
        let gy = 0;
        const eps = 0.001;
        try {
            x = parser.evaluate(`f(${point.x},${point.y})`);

            gx = parser.evaluate(`f(${point.x},${point.y})`) - parser.evaluate(`f(${point.x + eps},${point.y})`);
            gx /= -eps;
            gy = parser.evaluate(`f(${point.x},${point.y})`) - parser.evaluate(`f(${point.x},${point.y + eps})`);
            gy /= -eps;

            const mag = math.sqrt(gx * gx + gy * gy);
            gx /= mag;
            gy /= mag;

        } catch (error) {
            console.log(error)
        }
        if (!isNumeric(x) || isNaN(x)) {
            x = 0;
            y = 10;
        }
        setGrad({ gx: gx, gy: gy });
        return { x: y, y: x, dfx: gx, dfy: gy };
    }
    const onFunctionTextInput = (e) => {
        try {
            parser.evaluate('f(x, y) = ' + e.target.value);
            parser2.evaluate('f(x, y) = ' + e.target.value);
            setFunction(e.target.value);
        } catch (error) {
            parser.evaluate('f(x, y) = 0');
            parser2.evaluate('f(x, y) = 0');
            setFunction('0')
            console.log("invalid input")
        }
    }

    const drawPoints = (points) => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, 400, 400);
        for (const box of points) {
            const pixStart = convert(box.start);
            const pixEnd = convert(box.end);
            ctx.fillStyle = "#000000";
            ctx.fillRect(pixStart.x, pixStart.y, pixEnd.x - pixStart.x, pixEnd.y - pixStart.y);
        }
    }

    const contour = async (elevation) => {
        let outputArr = [];
        const pushto = (element) => {
            outputArr.push(element);
        }
        contour_r(elevation, 2, { x: range.xmin, y: range.ymax }, { x: range.xmax, y: range.ymin }, 9, pushto);
        return outputArr;
    }

    const getRandomPoint = (start, end) => {
        const getRand = (min, max) => {
            return Math.random() * (max - min) + min;
        }
        return { x: getRand(start.x, end.x), y: getRand(start.y, end.y) };
    }

    const checkSquare = (start, end, elevation, numSamples) => {
        let m = 0;
        let samples = []
        for (let i = 0; i < numSamples; i++) {
            samples.push(getRandomPoint(start, end));
        }

        const evalSign = (point, el) => {
            return math.sign(parser.evaluate(`f(${point.x},${point.y})`) - el);
        }

        samples.push(start);
        samples.push(end);

        // check all the samples
        let sign = evalSign(samples[0], elevation);
        let prev = sign;
        for (let i = 0; i < numSamples+2; i++) {
            try {
                sign = evalSign(samples[i], elevation);
                if (prev !== sign) {
                    return true;
                }
            } catch (error) {
                console.log(error);
            }
        }
        return false;
    }

    const getMidpoint = (start, end) => {
        return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    }

    const contour_r = (elevation, subdivisions, start, end, maxDepth, func) => {
        const dxy = { x: math.abs((end.x - start.x) / subdivisions), y: math.abs((start.y - end.y) / subdivisions) };

        for (let i = 0; i < subdivisions; i++) {
            for (let j = 0; j < subdivisions; j++) {

                let curPoint = { x: start.x + i * dxy.x, y: start.y - j * dxy.y };
                let curEnd = { x: curPoint.x + dxy.x, y: curPoint.y - dxy.y };
                const corners = [
                    { x: curPoint.x, y: curPoint.y },
                    { x: curPoint.x, y: curPoint.y - dxy.y },
                    { x: curPoint.x + dxy.x, y: curPoint.y - dxy.y },
                    { x: curPoint.x + dxy.x, y: curPoint.y }
                ];
                const hit = checkSquare(start, end, elevation, Math.max(maxDepth, 2));

                if (hit === undefined) {
                    return;
                }

                if (hit) {
                    if (maxDepth === 0) {
                        // push start and end to output
                        func({ start: start, end: end });
                        break;
                    }
                    contour_r(elevation, subdivisions, curPoint, curEnd, maxDepth - 1, func);
                }
            }
        }
    }


    return (
        <>
            <div>
                <input className="input-bounds" onInput={onYmax} type="number" placeholder={1}></input>
                <div className="flex-row">
                    <input className="input-bounds" onInput={onXmin} type="number" placeholder={-1}></input>
                    <div ref={containerRef} className="input-container">
                        <canvas ref={canvasRef} width={400} height={400} id="canvas" className="canvas"></canvas>
                        <Draggable bounds="parent" onDrag={onDrag}>
                            <div ref={inputRef} className="input-draggable">
                                <div className="position-label">({position.x.toFixed(2)}, {position.y.toFixed(2)})</div>
                                <svg style={{ position: "absolute", transform: "translate(-50px,-40px)", zIndex: "20" }} height="200px" width="100px">
                                    <line x1={50 + grad.gx * 10} y1={50 + -grad.gy * 10} x2={50 + grad.gx * 30} y2={50 + -grad.gy * 30} style={{ stroke: "rgb(255,0,0)", strokeWidth: 2 }} />
                                </svg>
                            </div>
                        </Draggable>
                    </div>
                    <input className="input-bounds" onInput={onXmax} type="number" placeholder={1}></input>
                </div>
                <input className="input-bounds" onInput={onYmin} type="number" placeholder={-1}></input>

            </div>
            <div className="function">
                <label>f(x, y) =</label>
                <input onInput={onFunctionTextInput} type="text"></input>
                <button onClick={() => { contour(0.5).then((points) => { drawPoints(points) }) }}>Contour</button>
            </div>
        </>
    )
}

export default Input;