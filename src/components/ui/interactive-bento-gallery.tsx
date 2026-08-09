"use client"
import React, { useEffect, useRef, useState } from 'react'
// This project ships `motion` (v12), which is framer-motion under its new name.
// Importing from 'framer-motion' would pull a second copy of the same library.
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

/** A tile in the bento grid. `span` carries the grid-span utilities. */
export interface MediaItemType {
    id: number;
    type: string;
    title: string;
    desc: string;
    url: string;
    span: string;
}

// MediaItem component renders either a video or image based on item.type
const MediaItem = ({ item, className, onClick }: { item: MediaItemType, className?: string, onClick?: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);

    // Only play a video while it is actually on screen.
    useEffect(() => {
        const node = videoRef.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((entry) => setIsInView(entry.isIntersecting)),
            { root: null, rootMargin: '50px', threshold: 0.1 },
        );
        observer.observe(node);
        return () => observer.unobserve(node);
    }, []);

    useEffect(() => {
        const node = videoRef.current;
        if (!node) return;
        let mounted = true;

        const handleVideoPlay = async () => {
            if (!isInView || !mounted) return;
            try {
                if (node.readyState >= 3) {
                    setIsBuffering(false);
                    await node.play();
                } else {
                    setIsBuffering(true);
                    await new Promise((resolve) => {
                        node.oncanplay = resolve;
                    });
                    if (mounted) {
                        setIsBuffering(false);
                        await node.play();
                    }
                }
            } catch (error) {
                console.warn('Video playback failed:', error);
            }
        };

        if (isInView) handleVideoPlay();
        else node.pause();

        return () => {
            mounted = false;
            node.pause();
        };
    }, [isInView]);

    if (item.type === 'video') {
        return (
            <div className={`${className} relative overflow-hidden`}>
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    onClick={onClick}
                    playsInline
                    muted
                    loop
                    preload="auto"
                    style={{
                        opacity: isBuffering ? 0.8 : 1,
                        transition: 'opacity 0.2s',
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                    }}
                >
                    <source src={item.url} type="video/mp4" />
                </video>
                {isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-latte rounded-full animate-spin" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <img
            src={item.url}
            alt={item.title}
            className={`${className} object-cover cursor-pointer`}
            onClick={onClick}
            loading="lazy"
            decoding="async"
        />
    );
};

// GalleryModal component displays the selected media item in a modal
interface GalleryModalProps {
    selectedItem: MediaItemType;
    isOpen: boolean;
    onClose: () => void;
    setSelectedItem: (item: MediaItemType | null) => void;
    mediaItems: MediaItemType[];
}

const GalleryModal = ({ selectedItem, isOpen, onClose, setSelectedItem, mediaItems }: GalleryModalProps) => {
    const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

    // Escape closes, and the page behind must not scroll under the viewer.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Viewer. Above the nav (z-30) and the scroll progress bar (z-60). */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="fixed inset-0 z-[120] bg-ink/92 backdrop-blur-xl"
            >
                <div className="h-full flex flex-col">
                    <div className="flex-1 p-3 sm:p-6 md:p-10 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedItem.id}
                                // Sized to the photo rather than a fixed 16/9 box: these are
                                // portrait pours, and a wide frame would letterbox them.
                                className="relative max-h-[78vh] max-w-[min(92vw,52rem)] rounded-2xl overflow-hidden border border-line shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
                                initial={{ y: 20, scale: 0.97, opacity: 0 }}
                                animate={{
                                    y: 0,
                                    scale: 1,
                                    opacity: 1,
                                    transition: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },
                                }}
                                exit={{ y: 20, scale: 0.97, opacity: 0, transition: { duration: 0.15 } }}
                            >
                                <MediaItem
                                    item={selectedItem}
                                    className="max-h-[78vh] w-auto object-contain"
                                    onClick={onClose}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-ink via-ink/70 to-transparent">
                                    <h3 className="font-display text-white text-base sm:text-lg md:text-xl font-semibold">
                                        {selectedItem.title}
                                    </h3>
                                    {selectedItem.desc && (
                                        <p className="text-muted text-xs sm:text-sm mt-1">{selectedItem.desc}</p>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <motion.button
                    className="hoverable absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full border border-white/20 bg-card/70 text-muted backdrop-blur-sm transition-colors hover:border-latte hover:text-latte"
                    onClick={onClose}
                    aria-label="Close"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </motion.div>

            {/* Draggable filmstrip. */}
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.1}
                initial={false}
                animate={{ x: dockPosition.x, y: dockPosition.y }}
                onDragEnd={(_, info) => {
                    setDockPosition((prev) => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }));
                }}
                className="fixed z-[130] left-1/2 bottom-5 -translate-x-1/2 touch-none"
            >
                <motion.div className="relative rounded-xl bg-latte/10 backdrop-blur-xl border border-latte/30 shadow-lg cursor-grab active:cursor-grabbing">
                    <div className="flex items-center -space-x-2 px-3 py-2">
                        {mediaItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                }}
                                style={{ zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index }}
                                className={`
                                    relative group
                                    w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0
                                    rounded-lg overflow-hidden
                                    cursor-pointer hover:z-20
                                    ${selectedItem.id === item.id
                                        ? 'ring-2 ring-latte/80 shadow-lg'
                                        : 'hover:ring-2 hover:ring-white/30'}
                                `}
                                initial={{ rotate: index % 2 === 0 ? -15 : 15 }}
                                animate={{
                                    scale: selectedItem.id === item.id ? 1.2 : 1,
                                    rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -15 : 15,
                                    y: selectedItem.id === item.id ? -8 : 0,
                                }}
                                whileHover={{
                                    scale: 1.3,
                                    rotate: 0,
                                    y: -10,
                                    transition: { type: 'spring', stiffness: 400, damping: 25 },
                                }}
                            >
                                <MediaItem item={item} className="w-full h-full" onClick={() => setSelectedItem(item)} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                                {selectedItem.id === item.id && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute -inset-2 bg-latte/25 blur-xl"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};

interface InteractiveBentoGalleryProps {
    mediaItems: MediaItemType[]
    /** Optional — the latte page renders its own header above the grid. */
    title?: string
    description?: string
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({ mediaItems, title, description }) => {
    const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);
    const [items, setItems] = useState(mediaItems);
    const [isDragging, setIsDragging] = useState(false);

    // Keep in step when the source list changes (more photos dropped in).
    useEffect(() => setItems(mediaItems), [mediaItems]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {(title || description) && (
                <div className="mb-8 text-center">
                    {title && (
                        <motion.h2
                            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-latte to-white"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {title}
                        </motion.h2>
                    )}
                    {description && (
                        <motion.p
                            className="mt-2 text-sm sm:text-base text-muted"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {description}
                        </motion.p>
                    )}
                </div>
            )}

            <AnimatePresence mode="wait">
                {selectedItem ? (
                    <GalleryModal
                        selectedItem={selectedItem}
                        isOpen={true}
                        onClose={() => setSelectedItem(null)}
                        setSelectedItem={setSelectedItem}
                        mediaItems={items}
                    />
                ) : (
                    <motion.div
                        // `dense` backfills the holes that mixed row-spans leave behind.
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 auto-rows-[60px] [grid-auto-flow:dense]"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
                        }}
                    >
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layoutId={`media-${item.id}`}
                                className={`relative overflow-hidden rounded-xl border border-line cursor-move ${item.span}`}
                                onClick={() => !isDragging && setSelectedItem(item)}
                                variants={{
                                    hidden: { y: 50, scale: 0.9, opacity: 0 },
                                    visible: {
                                        y: 0,
                                        scale: 1,
                                        opacity: 1,
                                        transition: { type: 'spring', stiffness: 350, damping: 25, delay: index * 0.05 },
                                    },
                                }}
                                whileHover={{ scale: 1.02 }}
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={1}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={(_, info) => {
                                    setIsDragging(false);
                                    const moveDistance = info.offset.x + info.offset.y;
                                    if (Math.abs(moveDistance) > 50) {
                                        const newItems = [...items];
                                        const draggedItem = newItems[index];
                                        const targetIndex =
                                            moveDistance > 0
                                                ? Math.min(index + 1, items.length - 1)
                                                : Math.max(index - 1, 0);
                                        newItems.splice(index, 1);
                                        newItems.splice(targetIndex, 0, draggedItem);
                                        setItems(newItems);
                                    }
                                }}
                            >
                                <MediaItem item={item} className="absolute inset-0 w-full h-full" />
                                <motion.div
                                    className="absolute inset-0 flex flex-col justify-end p-3 md:p-4"
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                                    <h3 className="relative font-display text-white text-xs sm:text-sm md:text-base font-medium line-clamp-1">
                                        {item.title}
                                    </h3>
                                    {item.desc && (
                                        <p className="relative text-white/70 text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-2">
                                            {item.desc}
                                        </p>
                                    )}
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveBentoGallery
