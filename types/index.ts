export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

export interface CardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export interface FormData {
  name: string;
  email: string;
  businessUrl: string;
  service: string;
}

export interface Testimonial {
  id: number;
  name: string;
  company: string;
  quote: string;
  image?: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Client {
  id: number;
  name: string;
  logo?: string;
}
