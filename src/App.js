import React, {useEffect, useRef, useState} from 'react';
import QRCode from "qrcode.react";
import CryptoJS from 'crypto-js'
import './App.css';


const App = (props) => {
    //-------------------------------------------------------------------------------------
    //Text in english
    //-------------------------------------------------------------------------------------
    const SecretCode = 'SecretCode'
    const Hash       = 'Hash'
    const OpenCode   = 'OpenCode'
    const Difference = 'Difference'
    const Info       = 'You can change the secret code and observe the result.'

    //-------------------------------------------------------------------------------------
    //src for images
    //-------------------------------------------------------------------------------------
    const pictLogo = './img/logo.svg'
    const pictRepeat = './img/repeat.png'

    //-------------------------------------------------------------------------------------
    //useState variables
    //NB! Some variables needs useRef reference for use in setInterval handler
    //-------------------------------------------------------------------------------------

    const [location, setLocation] = useState(window.location.href);

    const [phase, setPhase] = useState(0);
    const phaseRef = useRef(phase);
    phaseRef.current = phase;

    const [timerId, setTimerId] = useState(undefined);
    const timerRef = useRef(timerId);
    timerRef.current = timerId;

    const [codeEditable, setCodeEditable] = useState (undefined)
    //-------------------------------------------------------------------------------------
    //Extract data (publicCode, secretCode) from location
    //NB! secretCode needs useRef reference for use in setInterval handler
    //-------------------------------------------------------------------------------------
    const publicCode = (/public_code=/).test(location) ? (/.*public_code=(\w*).*/).exec(location)[1] : ''
    const secretCode = (/secret_code=/).test(location) ? (/.*secret_code=(\w*).*/).exec(location)[1] : ''
    const secretRef = useRef(secretCode);
    secretRef.current = secretCode;

    //-------------------------------------------------------------------------------------
    //isAnimationEnd
    //-------------------------------------------------------------------------------------
    const isAnimationEnd = secretCode.length && (phase === secretCode.length)

    //-------------------------------------------------------------------------------------
    //Take string fragment  for animation
    //-------------------------------------------------------------------------------------
    const secretCodePhase = codeEditable || secretCode.substr(0, Math.min(secretCode.length, phase))
    const hashCodePhase = CryptoJS.MD5(secretCodePhase).toString();

    //-------------------------------------------------------------------------------------
    // onTimeout - set next phase for animation
    //-------------------------------------------------------------------------------------
    const onTimeout = () => {
        console.log(secretRef.current.length, timerRef.current, phaseRef.current)
        if (secretRef.current.length && phaseRef.current >= secretRef.current.length) {
            if (timerRef.current !== undefined) {
                clearInterval(timerRef.current)
                setTimerId(undefined)
            }
        }
        else {
            if (secretRef.current.charAt(phaseRef.current)==='_') {
                clearInterval(timerRef.current)
                setTimerId(setInterval(onTimeout, 500))
            }
            setPhase(phaseRef.current + 1)
        }
    }

    //-------------------------------------------------------------------------------------
    // useEffect.
    //On start:
    //  - correct location
    //  - start timer for animation
    //On finish:
    //  - stop timer if it running
    //-------------------------------------------------------------------------------------
    useEffect(() => {
        console.log ('useEffect')
        //If location is not correct (i.e. fragments 'public_code=' and 'secret_code=' are absent),
        // then use test example as location
        if (!(/public_code=/).test(location) || !(/secret_code=/).test(location)) {
            setLocation ('?public_code=0123456789abcdef0123456789abcdef&secret_code=ThisIsTestKeyExample_ACDFAC_CAFDCA')
        }

        //Start interval timer for animation
        setTimerId(setInterval(onTimeout, 200))

        //Stop timer
        return () => {
            if (timerId) clearInterval(timerId)
        }
    }, [])     //only one time

    //-------------------------------------------------------------------------------------
    // onRefresh - start animation
    //-------------------------------------------------------------------------------------
    const onRefresh = () => {
        setPhase(0)

        if (timerId) clearInterval(timerId)
        setTimerId(setInterval(onTimeout, 200))

        setCodeEditable (undefined)
    }


    //-------------------------------------------------------------------------------------
    // Other code
    //-------------------------------------------------------------------------------------

    const getDifference = (first, second) => {
        let result = ''
        for (let i = 0; i < Math.max (first.length, second.length); i++) {
            result += first.charAt(i) === second.charAt(i) ? '0':'1'
        }
        return result
    }

    const getDifferColored = (first, second) => {
        let isEqualFragment = true;
        let fragment = '';
        let key = 0;
        let result = []

        const pushFragment = () => {
            if (fragment.length) {
                if (isEqualFragment) result.push (<span key={key++} className={'clGreen'}>{fragment}</span>)
                else                 result.push (<span key={key++} className={'clRed'}>{fragment}</span>)
            }
        }
        for (let i = 0; i < first.length; i++) {
            if ((first[i] === second[i] && isEqualFragment) ||
                (first[i] !== second[i] && !isEqualFragment)) fragment += first[i]
            else {
                pushFragment()
                isEqualFragment = !isEqualFragment
                fragment = first[i]
            }
        }
        pushFragment()

        return result
    }

    const differSecret = getDifference (secretCodePhase, secretCode)
    const differPublic = getDifference (hashCodePhase, publicCode)
    const differHashColored = getDifferColored (hashCodePhase, publicCode)
    const differPublicColored = getDifferColored (differPublic, '00000000000000000000000000000000')


    //-------------------------------------------------------------------------------------
    // Return now
    //-------------------------------------------------------------------------------------

    return (
        <div className={'main'}>
{/*         //-------------------------------------------------------------------------------------
            //                      SecretCode:
            //------------------------------------------------------------------------------------- */}
            <div className='clCipherFragment'>
                <div className='clRowTitle'>
                    {SecretCode}:
                    <img src={pictRepeat} className='clRepeat' alt='' onClick={onRefresh}/>
                </div>
                {/*<div className={secretCode === secretCodePhase? 'clRowGreen':'clRowYellow'}>{secretCodePhase}</div>*/}
                <input className={secretCode === secretCodePhase? 'clRowGreen':'clRowYellow'}
                       value={secretCodePhase}
                       disabled={!isAnimationEnd}
                       onChange={(e)=>{setCodeEditable (e.target.value)}}
                />

                <div className='clRowQR'>
                    <QRCode className='clQR' renderAs='svg' level='L' value={secretCodePhase}/>
                    <button className='clQRsign'>-</button>

                    <QRCode className='clQR' renderAs='svg' level='L' value={secretCode}/>
                    <img className='clQRlogo' src={pictLogo} alt=""/>
                    <button className='clQRsign'>=</button>

                    {secretCode === secretCodePhase ?
                        <div className='clQRgreenSquare'></div> :
                        <QRCode className='clQR' renderAs='svg' level='L' value={differSecret} bgColor='red' fgColor={'green'}/>
                    }
                </div>
            </div>

{/*         //-------------------------------------------------------------------------------------
            //                      Hash (SecretCode):
            //------------------------------------------------------------------------------------- */}
            <div className='clCipherFragment'>
                <div className='clRowTitle'>{Hash} ({SecretCode}):</div>
                <div className={publicCode === hashCodePhase? 'clRowGreen':'clRowYellow'}>{differHashColored}</div>

                <div className='clRowQR'>
                    <QRCode className='clQR clQRshift' renderAs='svg' level='L' value={hashCodePhase}/>
                </div>
            </div>

{/*         //-------------------------------------------------------------------------------------
            //                      OpenCode:
            //------------------------------------------------------------------------------------- */}
            <div className='clCipherFragment'>
                <div className='clRowTitle'>{OpenCode}:</div>
                <div className='clRowGreen'>{publicCode}</div>

                <div className='clRowQR'>
                    <QRCode className='clQR clQRshift' renderAs='svg' level='L' value={publicCode}/>
                    <img className='clQRlogo' src={pictLogo} alt=''/>
                </div>
            </div>

{/*         //-------------------------------------------------------------------------------------
            //                      Hash (SecretCode) - OpenCode:
            //------------------------------------------------------------------------------------- */}
            <div className='clRowTitle'>{Hash} ({SecretCode}) - {OpenCode}:</div>
            <div className={publicCode === hashCodePhase? 'clRowGreen':'clRowYellow'}>{differPublicColored}</div>

            <div className='clRowQR'>
                <QRCode className='clQR' renderAs='svg' level='L' value={hashCodePhase}/>
                <button className='clQRsign'>-</button>

                <QRCode className='clQR' renderAs='svg' level='L' value={publicCode}/>
                <img className="clQRlogo" src={pictLogo} alt=''/>
                <button className='clQRsign'>=</button>

                {publicCode === hashCodePhase ?
                    <div className='clQRgreenSquare'></div> :
                    <QRCode className='clQR' renderAs='svg' level='L' value={differPublic} bgColor='red' fgColor={'green'}/>
                }
            </div>

{/*         //-------------------------------------------------------------------------------------
            //  Labels:            Hash            OpenCode            Difference
            //                  (SecretCode)
            //------------------------------------------------------------------------------------- */}
            <div className='clRowLabel'>
                <button className='clLabelHash'>{Hash}<br/>({SecretCode})</button>
                <button className='clLabelOpen'>{OpenCode}</button>
                <button className='clLabelDiff'>{Difference}</button>
            </div>

{/*         //-------------------------------------------------------------------------------------
            //                      Info Line
            //------------------------------------------------------------------------------------- */}
            {isAnimationEnd ?
                <div className='clInfo'>
                    {/*eslint-disable-next-line*/}
                    <marquee>
                        {Info}
                        {/*eslint-disable-next-line*/}
                    </marquee>
                </div> : null
            }
        </div>
    )
}

export default App;
