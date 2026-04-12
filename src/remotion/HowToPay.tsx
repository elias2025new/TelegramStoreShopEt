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
            <Sequence from={0} durationInFrames={120}>
                <AbsoluteFill className="bg-[#111] flex items-center justify-center">
                    <div className="text-center space-y-4 px-10">
                        <h1 
                            className="text-7xl font-black uppercase tracking-tighter text-[#cba153]"
                            style={{ transform: `scale(${spring({ frame, fps, config: springConfig })})` }}
                        >
                            Telebirr
                        </h1>
                        <p className="text-3xl font-bold text-gray-400">Tutorial: How to Pay</p>
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* Scene 2: Copy Phone Number from Checkout */}
            <Sequence from={120} durationInFrames={160}>
                <AbsoluteFill className="bg-[#f8f9fa] flex items-center justify-center">
                    <div 
                        className="w-[90%] bg-white rounded-[50px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col items-center p-16 space-y-10"
                        style={{ transform: `scale(${interpolate(frame, [120, 160], [0.8, 1], { extrapolateRight: 'clamp' })})` }}
                    >
                        <div className="text-xl font-black text-[#cba153] tracking-[0.3em] uppercase">STEP 1: COPY NUMBER</div>
                        <div className="w-full h-32 bg-gray-50 rounded-3xl border-2 border-gray-100 flex items-center justify-between px-10 shadow-inner">
                            <span className="font-mono font-black text-5xl text-gray-900 tracking-tighter">09 63 13 81 23</span>
                            <div 
                                className={`text-xl font-black px-6 py-4 rounded-2xl transition-colors duration-200 ${frame > 240 ? 'bg-green-500 text-white' : 'bg-[#cba153] text-black'}`}
                                style={{ transform: `scale(${frame > 240 && frame < 260 ? 1.2 : 1})` }}
                            >
                                {frame > 240 ? 'COPIED!' : 'COPY'}
                            </div>
                        </div>
                    </div>
                    {/* Pointer animation */}
                    <Pointer 
                        x={interpolate(frame, [170, 240], [width + 200, width/2 + 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
                        y={height / 2 + 35}
                        opacity={interpolate(frame, [160, 180, 265, 275], [0, 1, 1, 0])}
                        scale={interpolate(frame, [240, 245, 250], [1, 0.8, 1])}
                    />
                </AbsoluteFill>
            </Sequence>

            {/* Scene 3: Paste in Telebirr App */}
            <Sequence from={280} durationInFrames={150}>
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
                    
                    <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[85%] bg-[#cba153] py-6 px-4 rounded-3xl shadow-2xl border-4 border-white flex items-center justify-center">
                        <span className="text-black font-black text-4xl text-center uppercase tracking-tight">
                            Fill out the necessary
                        </span>
                    </div>
                    <Pointer 
                        x={width * 0.6}
                        y={height * 0.43}
                        opacity={interpolate(frame, [300, 320, 410, 425], [0, 1, 1, 0])}
                        scale={interpolate(frame, [325, 330, 335], [1, 0.8, 1])}
                    />
                </AbsoluteFill>
            </Sequence>

            {/* Scene 4: SMS Received & Copy */}
            <Sequence from={430} durationInFrames={150}>
                <AbsoluteFill className="bg-[#121212]">
                    <div className="relative w-full h-full">
                        <Img 
                            src={staticFile("tutorials/telebirr_sms.jpg")} 
                            className="w-full h-full object-cover"
                        />
                        {/* Blur sensitive areas (70px height for solid coverage) */}
                        {/* Upper Balance Blur (First SMS: 5,186.77) */}
                        <div 
                            className="absolute left-[10%] w-[60%] bg-[#121212] rounded"
                            style={{ top: '8.5%', height: 70 }}
                        />
                        {/* Name Blur (Dear bizawet) */}
                        <div 
                            className="absolute left-[15%] w-[40%] bg-[#121212] rounded"
                            style={{ top: '35%', height: 70 }}
                        />
                        {/* Paid Amount Blur (paid ETB 70.00) */}
                        <div 
                            className="absolute left-[22%] w-[40%] bg-[#121212] rounded"
                            style={{ top: '38.5%', height: 70 }}
                        />
                        {/* Lower Balance Blur (5,116.77) */}
                        <div 
                            className="absolute left-[10%] w-[50%] bg-[#121212] rounded"
                            style={{ top: '57.5%', height: 70 }}
                        />

                        {/* Copy Selection Animation */}
                        <div 
                            className="absolute bg-blue-500/30 border border-blue-400"
                            style={{
                                top: '40.6%',
                                left: '8%',
                                width: interpolate(frame, [470, 510], [0, 84], { extrapolateRight: 'clamp' }) + '%',
                                height: '14.5%',
                                opacity: interpolate(frame, [460, 480], [0, 1])
                            }}
                        />
                        {/* Copy Instruction Banner */}
                        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80%] bg-[#cba153] py-6 px-4 rounded-3xl shadow-2xl border-4 border-white flex items-center justify-center z-50">
                            <span className="text-black font-black text-5xl text-center uppercase tracking-tight">
                                Copy SMS
                            </span>
                        </div>
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* Scene 5: Paste in store & Finish */}
            <Sequence from={580} durationInFrames={220}>
                <AbsoluteFill className="bg-[#f8f9fa] flex flex-col items-center justify-center p-8 space-y-12">
                    <div className="w-[95%] bg-white rounded-[60px] shadow-2xl p-16 space-y-10 border border-gray-100">
                        <div className="text-2xl font-black text-[#cba153] tracking-[0.4em] uppercase">STEP 2: PASTE SMS</div>
                        <div className="w-full h-40 bg-gray-50 rounded-[40px] p-10 text-3xl text-gray-500 font-mono overflow-hidden shadow-inner flex items-center">
                            {frame > 610 ? 'Dear Customer, you have paid ETB 70.00...' : 'Paste here...'}
                        </div>
                        <div 
                            className="w-full h-24 bg-[#cba153] rounded-3xl flex items-center justify-center text-black font-black text-3xl uppercase tracking-[0.2em] shadow-2xl"
                            style={{ transform: `scale(${frame > 640 && frame < 660 ? 1.05 : 1})` }}
                        >
                            Place Order
                        </div>
                    </div>
                    
                    {/* Success Animation at the very end */}
                    {frame > 660 && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-10 space-y-10">
                            <div 
                                className="w-48 h-48 bg-green-500 rounded-full flex items-center justify-center shadow-2xl"
                                style={{ transform: `scale(${interpolate(frame, [660, 680], [0, 1], { extrapolateRight: 'clamp' })})` }}
                            >
                                <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={4} 
                                        d="M5 13l4 4L19 7" 
                                        style={{ strokeDasharray: 100, strokeDashoffset: interpolate(frame, [680, 710], [100, 0], { extrapolateRight: 'clamp' }) }}
                                    />
                                </svg>
                            </div>
                            <div 
                                className="text-center space-y-4"
                                style={{ opacity: interpolate(frame, [690, 720], [0, 1]) }}
                            >
                                <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter">
                                    Order Placed!
                                </h1>
                                <p className="text-3xl font-bold text-[#cba153] uppercase tracking-[0.3em]">
                                    Thank You For Shopping
                                </p>
                            </div>
                        </div>
                    )}
                </AbsoluteFill>
            </Sequence>

            {/* Global Overlay for transition */}
            <div 
                className="absolute inset-0 pointer-events-none z-[100]" 
                style={{ opacity: interpolate(frame, [780, 800], [0, 1]) }}
            >
                <div className="w-full h-full bg-black" />
            </div>

        </AbsoluteFill>
    );
};
