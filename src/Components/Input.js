import { isNumeric } from "mathjs";
import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable"
import "../Styles/Input.css"
import { on, trigger } from "../Utils/Events";
import mapRange from "../Utils/mapRange";
const math = require('mathjs');

function Input(props) {

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const [range, setRange] = useState({ xmin: -1.0, xmax: 1.0, ymin: -1.0, ymax: 1.0 });
    const [parser, setParser] = useState(math.parser());
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [func, setFunction] = useState("x");
    const [grad, setGrad] = useState({gx:0, gy:0});

    const onDrag = (e, data) => {
        setPosition(getPos(data));
        const output = evaluate(getPos(data));
        trigger('input:evaluate', output);
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
        setGrad({gx:gx, gy:gy});
        console.log(grad);
        return { x: y, y: x, dfx: gx, dfy: gy };
    }

    const onInput = (e) => {
        try {
            parser.evaluate('f(x, y) = ' + e.target.value);
            setFunction(e.target.value);
        } catch (error) {
            parser.evaluate('f(x, y) = 0');
            setFunction('0')
            console.log("invalid input")
        }
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

    return (
        <>
            <div>
                <input className="input-bounds" onInput={onYmax} type="number" placeholder={1}></input>
                <div className="flex-row">
                    <input className="input-bounds" onInput={onXmin} type="number" placeholder={-1}></input>
                    <div ref={containerRef} className="input-container">
                        <Draggable bounds="parent" onDrag={onDrag}>
                            <div ref={inputRef} className="input-draggable">
                                <div className="position-label">({position.x.toFixed(2)}, {position.y.toFixed(2)})</div>
                                <svg style={{position:"absolute", transform:"translate(-50px,-40px)"}} height="200px" width="100px">
                                    <line x1="50" y1="50" x2={50 + grad.gx*50} y2={50 + -grad.gy*50} style={{stroke:"rgb(255,0,0)",strokeWidth:2}} />
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
                <input onInput={onInput} type="text"></input>
            </div>
        </>
    )
}

export default Input;