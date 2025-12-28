export type SectionType = 
  | 'hero-product'
  | 'image-gallery'
  | 'feature-badges'
  | 'text-block'
  | 'product-info'
  | 'checkout-form'
  | 'cta-banner'
  | 'testimonials'
  | 'faq'
  | 'image-text'
  | 'video'
  | 'countdown'
  | 'divider'
  | 'spacer';

export interface BaseSection {
  id: string;
  type: SectionType;
  order: number;
  settings: Record<string, unknown>;
}

export interface HeroProductSection extends BaseSection {
  type: 'hero-product';
  settings: {
    images: string[];
    title: string;
    subtitle: string;
    price: string;
    originalPrice: string;
    buttonText: string;
    buttonLink: string;
    badges: Array<{ text: string; subtext: string }>;
    backgroundColor: string;
    textColor: string;
    layout: 'left-image' | 'right-image' | 'center';
  };
}

export interface ImageGallerySection extends BaseSection {
  type: 'image-gallery';
  settings: {
    images: string[];
    columns: number;
    gap: string;
    aspectRatio: 'square' | 'portrait' | 'landscape' | 'auto';
  };
}

export interface FeatureBadgesSection extends BaseSection {
  type: 'feature-badges';
  settings: {
    title: string;
    badges: Array<{ icon: string; title: string; description: string }>;
    columns: number;
    backgroundColor: string;
    textColor: string;
  };
}

export interface TextBlockSection extends BaseSection {
  type: 'text-block';
  settings: {
    content: string;
    alignment: 'left' | 'center' | 'right';
    fontSize: string;
    backgroundColor: string;
    textColor: string;
    padding: string;
  };
}

export interface ProductInfoSection extends BaseSection {
  type: 'product-info';
  settings: {
    productId: string;
    showPrice: boolean;
    showDescription: boolean;
    showImages: boolean;
    layout: 'horizontal' | 'vertical';
  };
}

export interface CheckoutFormSection extends BaseSection {
  type: 'checkout-form';
  settings: {
    title: string;
    buttonText: string;
    productId: string;
    fields: Array<{ name: string; label: string; required: boolean; type: string }>;
    backgroundColor: string;
    accentColor: string;
  };
}

export interface CTABannerSection extends BaseSection {
  type: 'cta-banner';
  settings: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    backgroundColor: string;
    textColor: string;
  };
}

export interface TestimonialsSection extends BaseSection {
  type: 'testimonials';
  settings: {
    title: string;
    items: Array<{ name: string; role: string; content: string; avatar: string }>;
    layout: 'grid' | 'carousel';
    columns: number;
  };
}

export interface FAQSection extends BaseSection {
  type: 'faq';
  settings: {
    title: string;
    items: Array<{ question: string; answer: string }>;
    backgroundColor: string;
  };
}

export interface ImageTextSection extends BaseSection {
  type: 'image-text';
  settings: {
    image: string;
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    imagePosition: 'left' | 'right';
    backgroundColor: string;
  };
}

export interface VideoSection extends BaseSection {
  type: 'video';
  settings: {
    videoUrl: string;
    autoplay: boolean;
    controls: boolean;
    loop: boolean;
  };
}

export interface CountdownSection extends BaseSection {
  type: 'countdown';
  settings: {
    title: string;
    endDate: string;
    backgroundColor: string;
    textColor: string;
  };
}

export interface DividerSection extends BaseSection {
  type: 'divider';
  settings: {
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
    thickness: string;
    width: string;
  };
}

export interface SpacerSection extends BaseSection {
  type: 'spacer';
  settings: {
    height: string;
  };
}

export type Section = 
  | HeroProductSection
  | ImageGallerySection
  | FeatureBadgesSection
  | TextBlockSection
  | ProductInfoSection
  | CheckoutFormSection
  | CTABannerSection
  | TestimonialsSection
  | FAQSection
  | ImageTextSection
  | VideoSection
  | CountdownSection
  | DividerSection
  | SpacerSection;

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  buttonStyle: 'filled' | 'outline' | 'ghost';
}

export const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#000000',
  secondaryColor: '#f5f5f5',
  accentColor: '#ef4444',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter',
  borderRadius: '8px',
  buttonStyle: 'filled',
};

export const SECTION_TEMPLATES: Record<SectionType, Partial<Section>> = {
  'hero-product': {
    type: 'hero-product',
    settings: {
      images: [],
      title: 'Product Title',
      subtitle: 'Product description goes here',
      price: '1350',
      originalPrice: '',
      buttonText: 'এখনই কিনুন',
      buttonLink: '#checkout',
      badges: [
        { text: '100%', subtext: 'Quality Guarantee' },
        { text: 'Size 36-46', subtext: 'Size Options' },
        { text: 'All Bangladesh', subtext: 'Delivery Service' },
      ],
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      layout: 'left-image',
    },
  },
  'image-gallery': {
    type: 'image-gallery',
    settings: {
      images: [],
      columns: 3,
      gap: '16px',
      aspectRatio: 'square',
    },
  },
  'feature-badges': {
    type: 'feature-badges',
    settings: {
      title: 'Features',
      badges: [],
      columns: 3,
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
    },
  },
  'text-block': {
    type: 'text-block',
    settings: {
      content: 'Enter your text here...',
      alignment: 'center',
      fontSize: '16px',
      backgroundColor: 'transparent',
      textColor: '#1f2937',
      padding: '32px',
    },
  },
  'product-info': {
    type: 'product-info',
    settings: {
      productId: '',
      showPrice: true,
      showDescription: true,
      showImages: true,
      layout: 'horizontal',
    },
  },
  'checkout-form': {
    type: 'checkout-form',
    settings: {
      title: 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন',
      buttonText: 'অর্ডার কনফার্ম করুন',
      productId: '',
      fields: [
        { name: 'name', label: 'আপনার নাম', required: true, type: 'text' },
        { name: 'phone', label: 'মোবাইল নম্বর', required: true, type: 'tel' },
        { name: 'address', label: 'সম্পূর্ণ ঠিকানা', required: true, type: 'textarea' },
      ],
      backgroundColor: '#f9fafb',
      accentColor: '#ef4444',
    },
  },
  'cta-banner': {
    type: 'cta-banner',
    settings: {
      title: 'Ready to Order?',
      subtitle: 'Get yours today!',
      buttonText: 'Order Now',
      buttonLink: '#checkout',
      backgroundColor: '#000000',
      textColor: '#ffffff',
    },
  },
  'testimonials': {
    type: 'testimonials',
    settings: {
      title: 'Customer Reviews',
      items: [],
      layout: 'grid',
      columns: 3,
    },
  },
  'faq': {
    type: 'faq',
    settings: {
      title: 'Frequently Asked Questions',
      items: [],
      backgroundColor: '#ffffff',
    },
  },
  'image-text': {
    type: 'image-text',
    settings: {
      image: '',
      title: 'Title',
      description: 'Description',
      buttonText: 'Learn More',
      buttonLink: '#',
      imagePosition: 'left',
      backgroundColor: '#ffffff',
    },
  },
  'video': {
    type: 'video',
    settings: {
      videoUrl: '',
      autoplay: false,
      controls: true,
      loop: false,
    },
  },
  'countdown': {
    type: 'countdown',
    settings: {
      title: 'Offer Ends In',
      endDate: '',
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
    },
  },
  'divider': {
    type: 'divider',
    settings: {
      style: 'solid',
      color: '#e5e7eb',
      thickness: '1px',
      width: '100%',
    },
  },
  'spacer': {
    type: 'spacer',
    settings: {
      height: '48px',
    },
  },
};
