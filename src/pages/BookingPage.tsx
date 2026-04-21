// Rezdy integration removed — use internal booking flow
import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const bookingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().max(20).optional(),
  preferred_date: z.string().trim().min(1, 'Preferred date is required'),
  experience_level: z.string().optional(),
  message: z.string().trim().max(1000).optional(),
  paymentChoice: z.enum(['now', 'link', 'none']).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const PAYPAL_LINK = 'https://paypal.me/prodivingasia';
const COURSE_DEPOSIT_RATE = 0.2;
const SKIP_PAYMENT_MESSAGE = 'You have chosen not to pay right now, no problem! We will contact you soon to arrange bookings and payment. Thank You, Pro Diving Asia Team.';

const COURSE_FALLBACKS: Record<string, { item: string; price?: number; currency?: string }> = {
  'wreck-diver': { item: 'PADI Wreck Diver Specialty', price: 8000, currency: 'THB' },
  'deep-diver': { item: 'PADI Deep Diver Specialty', price: 8000, currency: 'THB' },
  'self-reliant': { item: 'PADI Self-Reliant Diver Specialty', price: 8000, currency: 'THB' },
  'sidemount': { item: 'PADI Sidemount Diver Specialty', price: 8000, currency: 'THB' },
  'night-diver': { item: 'PADI Night Diver Specialty', price: 8000, currency: 'THB' },
  'peak-buoyancy': { item: 'PADI Peak Performance Buoyancy', price: 8000, currency: 'THB' },
  'navigator': { item: 'PADI Underwater Navigator Specialty', price: 3000, currency: 'THB' },
  'enriched-air': { item: 'PADI Enriched Air Diver Specialty', price: 8000, currency: 'THB' },
  'emergency-o2': { item: 'Emergency Oxygen Provider', price: 8000, currency: 'THB' },
  'dpv': { item: 'PADI DPV Diver Specialty', price: 4200, currency: 'THB' },
  'search-recovery': { item: 'PADI Search & Recovery Specialty', price: 8000, currency: 'THB' },
  'coral-watch': { item: 'Coral Watch Specialty', price: 2300, currency: 'THB' },
  'sea-turtle': { item: 'Sea Turtle Awareness Specialty', price: 2200, currency: 'THB' },
  'fish-id': { item: 'Fish Identification Specialty', price: 8000, currency: 'THB' },
  'dive-against-debris': { item: 'Dive Against Debris Specialty', price: 8000, currency: 'THB' },
  'shark-conservation': { item: 'Shark Conservation Specialty', price: 2500, currency: 'THB' },
  'whaleshark': { item: 'Whale Shark Awareness Specialty', price: 3500, currency: 'THB' },
  'underwater-naturalist': { item: 'PADI Underwater Naturalist Specialty', price: 3500, currency: 'THB' },
  'adaptive-support': { item: 'Adaptive Support Diver Specialty', price: 4000, currency: 'THB' },
  'current-diver': { item: 'PADI Current Diver Specialty', currency: 'THB' },
  'photography': { item: 'PADI Underwater Photography Specialty', price: 8000, currency: 'THB' },
  'equipment-specialist': { item: 'PADI Equipment Specialist', currency: 'THB' },
  'boat-diver': { item: 'PADI Boat Diver Specialty', currency: 'THB' },
  'divemaster-internship': { item: 'PADI Divemaster Internship', currency: 'THB' },
  'instructor-internship': { item: 'PADI Instructor Internship', currency: 'THB' },
};

const ADDONS = [
  { id: 'equipment', label: 'Equipment rental', amount: 300 },
  { id: 'photos', label: 'Underwater photos', amount: 500 },
  { id: 'lunch', label: 'Lunch & drinks', amount: 200 },
];

type BookingItemType = 'course' | 'dive' | 'stay';


const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const apiBaseRaw = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const apiBaseNormalized = apiBaseRaw
    ? (apiBaseRaw.startsWith('http://') || apiBaseRaw.startsWith('https://')
        ? apiBaseRaw
        : `https://${apiBaseRaw}`)
    : 'https://koh-tao-dive-dreams-mocha.vercel.app';
  const apiBase = apiBaseNormalized.replace(/\/+$/, '');
  const apiUrl = (path: string) => `${apiBase}${path}`;
  const courseSlug = (searchParams.get('course') || '').trim();
  const fallbackCourse = courseSlug ? COURSE_FALLBACKS[courseSlug] : undefined;
  const hasDirectBookingContext = Boolean(
    searchParams.get('item') ||
    searchParams.get('type') ||
    searchParams.get('price') ||
    fallbackCourse
  );
  const selectedBookingKind = (searchParams.get('bookingKind') || '').trim();
  const bookingSource = (searchParams.get('source') || 'direct').trim();
  const rawType = (searchParams.get('type') || '').trim();
  const genericType: BookingItemType = selectedBookingKind === 'course' ? 'course' : 'dive';
  const itemType: BookingItemType = rawType === 'dive' || rawType === 'stay' || rawType === 'course'
    ? rawType
    : (hasDirectBookingContext ? 'course' : genericType);
  const itemTitle = searchParams.get('item') || fallbackCourse?.item || (itemType === 'course' ? 'Course Booking' : 'Fun Dive');
  const isDiveBooking = itemType === 'dive';
  const isCourseBooking = itemType === 'course';
  const isStayBooking = itemType === 'stay';
  const rawPrice = searchParams.get('price');
  const parsedPrice = rawPrice ? Number(rawPrice) : NaN;
  const baseCourseCostMajor = Number.isFinite(parsedPrice)
    ? parsedPrice
    : (fallbackCourse?.price || (!hasDirectBookingContext && itemType === 'dive' ? 2000 : 0));
  const parsedDeposit = Number(searchParams.get('deposit') || '0');
  const depositFromQuery = Number.isFinite(parsedDeposit) ? parsedDeposit : 0;
  const depositCurrency = searchParams.get('currency') || fallbackCourse?.currency || 'THB';
  const isFunDiveBooking = isDiveBooking && /fun dive/i.test(itemTitle);
  const isDiscoverScubaBooking = isDiveBooking && /(discover scuba|dsd)/i.test(itemTitle);

  const initialDiveCount = Math.min(20, Math.max(1, Number(searchParams.get('dives') || '2') || 2));
  const [funDiveCount, setFunDiveCount] = useState<number>(initialDiveCount);
  const initialCourseFunDiveCount = Math.min(10, Math.max(0, Number(searchParams.get('courseFunDives') || '0') || 0));
  const [courseFunDiveCount, setCourseFunDiveCount] = useState<number>(initialCourseFunDiveCount);
  const [stayWithUs, setStayWithUs] = useState<boolean>(searchParams.get('stay') === 'yes');
  const [showStayPopup, setShowStayPopup] = useState(false);

  const getFunDiveRate = (dives: number) => {
    if (dives >= 10) return 800;
    if (dives >= 2) return 900;
    return 1000;
  };

  const courseCostMajor = isFunDiveBooking
    ? getFunDiveRate(funDiveCount) * funDiveCount
    : baseCourseCostMajor;
  const courseFunDiveCostMajor = isCourseBooking && courseFunDiveCount > 0
    ? getFunDiveRate(courseFunDiveCount) * courseFunDiveCount
    : 0;
  const totalItemCostMajor = isCourseBooking ? courseCostMajor + courseFunDiveCostMajor : courseCostMajor;
  const depositFromPrice = totalItemCostMajor > 0 ? Math.round(totalItemCostMajor * COURSE_DEPOSIT_RATE) : 0;
  const depositMajor = depositFromPrice > 0 ? depositFromPrice : depositFromQuery;

  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const availableAddons = useMemo(() => {
    if (!isDiveBooking) return [];
    return ADDONS.filter((addon) => !(isDiscoverScubaBooking && addon.id === 'equipment'));
  }, [isDiveBooking, isDiscoverScubaBooking]);

  const totalAddons = useMemo(() => {
    if (!isDiveBooking) return 0;
    return availableAddons.reduce((sum, a) => sum + (selectedAddons[a.id] ? a.amount : 0), 0);
  }, [isDiveBooking, availableAddons, selectedAddons]);

  // Add course and accommodation selection to form state
  const [selectedCourse, setSelectedCourse] = useState<string>(courseSlug || 'open-water');
  const [accommodationType, setAccommodationType] = useState<string>('basic');
  const courseOptions = [
    { value: 'open-water', label: 'PADI Open Water', price: 12000 },
    { value: 'advanced-open-water', label: 'PADI Advanced Open Water', price: 11000 },
    { value: 'rescue-diver', label: 'PADI Rescue Diver', price: 13000 },
    { value: 'divemaster', label: 'PADI Divemaster', price: 35000 },
    // ...add more as needed
  ];
  const accommodationOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'deluxe', label: 'Deluxe' },
    { value: 'double', label: 'Double' },
    { value: 'single', label: 'Single' },
  ];
  const selectedCourseObj = courseOptions.find(c => c.value === selectedCourse) || courseOptions[0];
  const coursePrice = selectedCourseObj.price;
  const deposit = Math.round(coursePrice * 0.2);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      preferred_date: new Date().toISOString().slice(0, 10),
      experience_level: '',
      message: searchParams.get('message') || '',
      paymentChoice: itemType === 'course' || itemType === 'dive' ? 'now' : 'none',
    },
  });

  const [showPaymentLinks, setShowPaymentLinks] = useState(false);
  const [showSkipPaymentPopup, setShowSkipPaymentPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        access_key: import.meta.env.WEB3FORMS_ACCESS_KEY || import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '',
        subject: 'New Booking/Enquiry',
        from_name: data.name,
        email: data.email,
        message:
          `Course: ${selectedCourse}\nAccommodation: ${accommodationType}\nExperience: ${data.experience_level}\nPayment: ${data.paymentChoice}\nPrice: ฿${coursePrice}\nDeposit: ฿${deposit}\nMessage: ${data.message}`,
      };
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const wfData = await res.json();
      if (wfData.success) {
        if (data.paymentChoice === 'now') {
          window.open(`https://paypal.me/prodivingasia/${deposit}THB`, '_blank');
          toast.success('Booking sent! Please complete your deposit via PayPal.');
        } else {
          toast.success('Enquiry sent! We will contact you soon.');
        }
        form.reset();
      } else {
        toast.error('Failed to send booking/enquiry. Please try again.');
      }
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rezdy prefill removed.

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto bg-background rounded-xl shadow-xl shadow-blue-900/20 p-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold mb-2">Book a Course</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Select your course, accommodation, and enter your details to book.</p>

        <div className="mb-6">
          <label className="block font-medium mb-1">Course</label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label} (฿{c.price})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-1">Accommodation</label>
          <Select value={accommodationType} onValueChange={setAccommodationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select accommodation" />
            </SelectTrigger>
            <SelectContent>
              {accommodationOptions.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <div className="text-lg font-semibold">Course price: <span className="font-bold">฿{coursePrice}</span></div>
          <div className="text-md text-muted-foreground mt-1">Deposit payable now (20%): <span className="font-bold">฿{deposit}</span></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experience_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Have you dived before?</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never dived before</SelectItem>
                        <SelectItem value="try-dive">Tried diving once</SelectItem>
                        <SelectItem value="certified">Certified diver</SelectItem>
                        <SelectItem value="advanced">Advanced/Rescue/Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Anything else we should know?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentChoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Option</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payment option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Pay deposit now with PayPal</SelectItem>
                        <SelectItem value="none">Just send enquiry (no payment now)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
              Book Now
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default BookingPage;
