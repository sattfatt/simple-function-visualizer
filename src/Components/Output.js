import { useEffect, useState } from "react"
import Draggable from "react-draggable"
import "../Styles/Output.css"
import { off, on } from "../Utils/Events"
import { useRef } from "react"
import mapRange from "../Utils/mapRange";
import math, { abs, exp, pow } from "mathjs";

function Output(props) {

    const outputRef = useRef(null);
    const containerRef = useRef(null);
    const [range, setRange] = useState({ xmin: -1.0, xmax: 1.0, ymin: -1.0, ymax: 1.0 });
    const [pixelPos, setPixelPos] = useState({ x: 10, y: 10 });
    const [position, setPostion] = useState({ x: 0, y: 0 });

    const inRange = (position) => {
        if(position.x < range.xmin || position.x > range.xmax || position.y < range.ymin || position.y > range.ymax) {
            return false;
        }
        return true;
    }

    const fadeFactor = (position, power) => {

        let opacity = 1;
        if (!inRange(position)) {
            if(position.y > range.ymax) {
                opacity = pow(power, range.ymax - position.y).toFixed(2);
            }
            else if(position.y < range.ymax) {
                opacity = pow(power, position.y - range.ymin).toFixed(2);
            }
        }

        return opacity;
    }

    const convert = (data) => {
        const cw = containerRef.current.getBoundingClientRect().width;
        const ch = containerRef.current.getBoundingClientRect().height;
        const ow = outputRef.current.getBoundingClientRect().width;
        const oh = outputRef.current.getBoundingClientRect().height;

        const xini = mapRange(data.x, range.xmin, range.xmax, ow / 2, cw - ow / 2);
        const yini = mapRange(data.y, range.ymax, range.ymin, oh / 2, ch - oh / 2);
        const x = xini - ow / 2;
        const y = yini - oh / 2;
        return { x: x, y: y };
    }

    const onInputChange = (e) => {
        setPixelPos(convert(e.detail));
        setPostion(e.detail);
    }

    useEffect(() => {
        on('input:evaluate', onInputChange);
        return () => off('input:evaluate', onInputChange);
    }, [range])

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
        <div className="flex-col">
            <input className="input-bounds" onInput={onYmax} type="number" placeholder={1}></input>
            <div ref={containerRef} className="output-container">
                <Draggable bounds="parent" position={pixelPos}>
                    <div ref={outputRef} className="output-draggable">
                        <div className="position-label">({position.y.toFixed(2)})</div>
                    </div>
                </Draggable>
            </div>
            <input className="input-bounds" onInput={onYmin} type="number" placeholder={-1}></input>
        </div>

    )
}

export default Output;