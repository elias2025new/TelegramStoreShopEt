import React from 'react';
import { 
    AbsoluteFill, 
    interpolate, 
    useCurrentFrame, 
    useVideoConfig, 
    Img, 
    staticFile,
    Sequence,
    SpringConfig,
    spring
} from 'remotion';

// Simple Hand/Pointer component
const Pointer: React.FC<{ x: number; y: number; opacity: number; scale: number }> = ({ x, y, opacity, scale }) => {
    return (
        <div 
            className="absolute pointer-events-none z-50"
            style={{
                left: x,
                top: y,
                opacity,
                transform: `translate(-50%, -50%) scale(${scale})`,
            }}
        >
            <div className="w-12 h-12 bg-white/20 border-2 border-[#cba153] rounded-full flex items-center justify-center shadow-lg">
                <div className="w-4 h-4 bg-[#cba153] rounded-full animate-pulse" />
            </div>
        </div>
    );
};

export const HowToPay: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const springConfig: SpringConfig = {
        damping: 12,
        mass: 1,
        stiffness: 100,
        overshootClamping: false,
    };

    // Transition values
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill className="bg-black text-white font-sans overflow-hidden">
            
            {/* Scene 1: Intro */}
            <Sequence from={0} durationInFrames={60}>
                <AbsoluteFill className="bg-[#111] flex items-center justify-center">
                    <div className="text-center space-y-4 px-10">
                        <h1 
                            className="text-6xl font-black uppercase tracking-tighter text-[#cba153]"
                            style={{ transform: `scale(${spring({ frame, fps, config: springConfig })})` }}
                        >
                            Telebirr
                        </h1>
                        <p className="text-2xl font-bold text-gray-400">Tutorial: How to Pay</p>
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* Scene 2: Copy Phone Number from Checkout */}
            <Sequence from={60} durationInFrames={70}>
                <AbsoluteFill className="bg-[#f8f9fa] flex items-center justify-center">
                    <div 
                        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col items-center p-12 space-y-6"
                        style={{ transform: `scale(${interpolate(frame, [60, 75], [0.8, 1], { extrapolateRight: 'clamp' })})` }}
                    >
                        <div className="text-sm font-black text-[#cba153] tracking-[0.2em]">STEP 1: COPY NUMBER</div>
                        <div className="w-full h-20 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-between px-6 shadow-inner">
                            <span className="font-mono font-black text-3xl text-gray-900 tracking-tight">09 63 13 81 23</span>
                            <div 
                                className={`text-sm font-black px-4 py-2 rounded-xl transition-colors duration-200 ${frame > 95 ? 'bg-green-500 text-white' : 'bg-[#cba153] text-black'}`}
                                style={{ transform: `scale(${frame > 95 && frame < 105 ? 1.1 : 1})` }}
                            >
                                {frame > 95 ? 'COPIED!' : 'COPY'}
                            </div>
                        </div>
                    </div>
                    {/* Pointer animation */}
                    <Pointer 
                        x={interpolate(frame, [70, 95], [width + 200, width/2 + 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
                        y={height / 2 + 35}
                        opacity={interpolate(frame, [65, 75, 120, 130], [0, 1, 1, 0])}
                        scale={interpolate(frame, [95, 100, 105], [1, 0.8, 1])}
                    />
                </AbsoluteFill>
            </Sequence>

            {/* Scene 3: Paste in Telebirr App */}
            <Sequence from={130} durationInFrames={60}>
                <AbsoluteFill className="bg-white">
                    <Img 
                        src={staticFile("tutorials/telebirr_app.jpg")} 
                        className="w-full h-full object-cover"
                    />
                    {/* Blur 'Recent' name (Merko) */}
                    <div 
                        className="absolute left-[15%] w-[40%] bg-[#f8f9fa] backdrop-blur-xl rounded-md"
                        style={{ top: '56.5%', height: 70 }}
                    />
                    
                    <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[70%] h-10 flex items-center px-4 bg-white/10">
                        <span className="text-gray-900 font-bold text-xl">
                            {frame > 150 ? '0963138123' : ''}
                        </span>
                    </div>
                    <Pointer 
                        x={width / 2}
                        y={height * 0.35}
                        opacity={interpolate(frame, [135, 145, 180, 190], [0, 1, 1, 0])}
                        scale={interpolate(frame, [145, 150], [1, 0.9])}
                    />
                </AbsoluteFill>
            </Sequence>

            {/* Scene 4: SMS Received & Copy */}
            <Sequence from={190} durationInFrames={60}>
                <AbsoluteFill className="bg-[#121212]">
                    <div className="relative w-full h-full">
                        <Img 
                            src={staticFile("tutorials/telebirr_sms.jpg")} 
                            className="w-full h-full object-cover"
                        />
                        {/* Blur sensitive areas (70px height for solid coverage) */}
                        {/* Upper Balance Blur (First SMS: 5,186.77) */}
                        <div 
                            className="absolute left-[10%] w-[45%] bg-[#121212] rounded"
                            style={{ top: '6.2%', height: 70 }}
                        />
                        {/* Name Blur (Dear bizawet) */}
                        <div 
                            className="absolute left-[15%] w-[35%] bg-[#121212] rounded"
                            style={{ top: '35%', height: 70 }}
                        />
                        {/* Paid Amount Blur (paid ETB 70.00) */}
                        <div 
                            className="absolute left-[22%] w-[35%] bg-[#121212] rounded"
                            style={{ top: '38.5%', height: 70 }}
                        />
                        {/* Lower Balance Blur (5,116.77) */}
                        <div 
                            className="absolute left-[40%] w-[45%] bg-[#121212] rounded"
                            style={{ top: '53.8%', height: 70 }}
                        />

                        {/* Copy Selection Animation */}
                        <div 
                            className="absolute bg-blue-500/30 border border-blue-400"
                            style={{
                                top: '40.6%',
                                left: '8%',
                                width: interpolate(frame, [210, 230], [0, 84], { extrapolateRight: 'clamp' }) + '%',
                                height: '14.5%',
                                opacity: interpolate(frame, [205, 215], [0, 1])
                            }}
                        />
                    </div>
                    <div className="absolute bottom-10 w-full text-center">
                        <div className="inline-block bg-[#cba153] text-black font-black px-6 py-2 rounded-full text-lg shadow-lg">
                            COPY SMS
                        </div>
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* Scene 5: Paste in store & Finish */}
            <Sequence from={250} durationInFrames={50}>
                <AbsoluteFill className="bg-[#f8f9fa] flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="w-full bg-white rounded-3xl shadow-xl p-6 space-y-4 border border-gray-100">
                        <div className="text-xs font-black text-gray-400 tracking-widest">STEP 2: PASTE SMS</div>
                        <div className="w-full h-24 bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono overflow-hidden">
                            {frame > 270 ? 'Dear Customer, you have paid ETB 70.00... transaction number DDB5SPBBZZ...' : 'Paste here...'}
                        </div>
                        <div className="w-full h-12 bg-[#cba153] rounded-xl flex items-center justify-center text-black font-black uppercase tracking-widest shadow-md">
                            Place Order
                        </div>
                    </div>
                    
                    {/* Success Animation at the very end */}
                    {frame > 290 && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur flex items-center justify-center z-50">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    )}
                </AbsoluteFill>
            </Sequence>

            {/* Global Overlay for transition */}
            <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ opacity: interpolate(frame, [295, 300], [0, 1]) }}
            >
                <div className="w-full h-full bg-black" />
            </div>

        </AbsoluteFill>
    );
};
