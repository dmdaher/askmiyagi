'use client';

import { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import BrandingHeader from '@/components/ui/BrandingHeader';
import DeviceCard from '@/components/ui/DeviceCard';
import TutorialCard from '@/components/ui/TutorialCard';
import CategoryFilter from '@/components/ui/CategoryFilter';
import { getAvailableDevices } from '@/data/devices';
import { fantom08Tutorials } from '@/data/tutorials/fantom-08';
import { rc505mk2Tutorials } from '@/data/tutorials/rc505-mk2';
import { TUTORIAL_CATEGORIES } from '@/lib/constants';
import { DeviceInfo } from '@/types/device';
import { Tutorial } from '@/types/tutorial';

const allTutorials: Record<string, Tutorial[]> = {
  'fantom-08': fantom08Tutorials,
  'rc505-mk2': rc505mk2Tutorials,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const devices = getAvailableDevices();
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(() => {
    const deviceParam = searchParams.get('device');
    if (deviceParam) return devices.find((d) => d.id === deviceParam && d.available) ?? null;
    return null;
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const tutorialSectionRef = useRef<HTMLDivElement>(null);
  const hasAnimatedTutorials = useRef(false);

  // Scroll to tutorial list when arriving with ?device param
  useEffect(() => {
    if (searchParams.get('device') && selectedDevice) {
      setTimeout(() => {
        tutorialSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tutorials = useMemo(() => {
    if (!selectedDevice) return [];
    return allTutorials[selectedDevice.id] ?? [];
  }, [selectedDevice]);

  const filteredTutorials = useMemo(() => {
    if (!selectedCategory) return tutorials;
    return tutorials.filter((t) => t.category === selectedCategory);
  }, [tutorials, selectedCategory]);

  // After initial tutorial grid animation completes, skip re-animation on category changes
  useEffect(() => {
    if (selectedDevice && !hasAnimatedTutorials.current) {
      // Allow time for the initial stagger animation to play, then mark as animated
      const timer = setTimeout(() => {
        hasAnimatedTutorials.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!selectedDevice) {
      hasAnimatedTutorials.current = false;
    }
  }, [selectedDevice]);

  const relevantCategories = useMemo(() => {
    if (!selectedDevice) return [];
    const categoryIds = new Set(tutorials.map((t) => t.category));
    return TUTORIAL_CATEGORIES.filter((cat) => categoryIds.has(cat.id as typeof tutorials[number]['category']));
  }, [selectedDevice, tutorials]);

  function handleDeviceSelect(device: DeviceInfo) {
    if (!device.available) return;
    setSelectedDevice(device);
    setSelectedCategory(null);

    // Scroll to tutorial section after a short delay to allow render
    setTimeout(() => {
      tutorialSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleTutorialSelect(tutorial: Tutorial) {
    router.push(`/tutorial/${tutorial.deviceId}/${tutorial.id}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <BrandingHeader />

      <main className="flex-1">
        {/* Hero / Device Selection */}
        <motion.section
          className="mx-auto max-w-7xl px-6 py-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-12 text-center">
            <h2 className="mb-3 text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[#00aaff] to-[#0088dd] bg-clip-text text-transparent">
                Choose Your Device
              </span>
            </h2>
            <p className="mx-auto max-w-lg text-gray-400">
              Select a device to explore interactive, step-by-step tutorials that guide you through
              every button, knob, and feature.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2"
          >
            {devices.map((device) => (
              <motion.div key={device.id} variants={itemVariants}>
                <DeviceCard
                  device={device}
                  tutorialCount={(allTutorials[device.id] ?? []).length}
                  onClick={() => handleDeviceSelect(device)}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Tutorial Library */}
        <AnimatePresence>
          {selectedDevice && (
            <motion.section
              ref={tutorialSectionRef}
              className="border-t border-[var(--card-border)] bg-[var(--surface)]/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="mx-auto max-w-7xl px-6 py-12">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.25 }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-100">
                      {selectedDevice.name}{' '}
                      <span className="text-gray-500">Tutorials</span>
                    </h3>
                    <button
                      onClick={() => setSelectedDevice(null)}
                      className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[var(--surface)] hover:text-gray-200"
                    >
                      Change Device
                    </button>
                  </div>

                  {/* Category Filter */}
                  {relevantCategories.length > 0 && (
                    <div className="mb-8">
                      <CategoryFilter
                        categories={relevantCategories}
                        selected={selectedCategory}
                        onSelect={setSelectedCategory}
                      />
                    </div>
                  )}

                  {/* Tutorial Grid */}
                  {filteredTutorials.length > 0 ? (
                    <motion.div
                      key={selectedCategory ?? 'all'}
                      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      variants={containerVariants}
                      initial={hasAnimatedTutorials.current ? false : 'hidden'}
                      animate="visible"
                    >
                      {filteredTutorials.map((tutorial) => (
                        <motion.div key={tutorial.id} variants={itemVariants}>
                          <TutorialCard
                            tutorial={tutorial}
                            onClick={() => handleTutorialSelect(tutorial)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--card-border)] py-16">
                      <p className="mb-1 text-lg text-gray-400">No tutorials found</p>
                      <p className="text-sm text-gray-500">
                        {selectedCategory
                          ? 'Try selecting a different category or view all tutorials.'
                          : 'Tutorials for this device are coming soon.'}
                      </p>
                      {selectedCategory && (
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        >
                          View All
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] bg-[var(--card-bg)]/50">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Ask Miyagi &mdash; Step-by-step interactive tutorials using a replica of your synth.
            </p>
            <p className="text-xs text-gray-600">
              Not affiliated with Roland or Boss.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <a href="/legal/disclaimer" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Disclaimer
            </a>
            <a href="/legal/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Terms of Service
            </a>
            <a href="/legal/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
