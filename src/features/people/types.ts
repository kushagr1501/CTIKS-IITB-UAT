export type Faculty = {
  id?: string;
  name: string;
  department: string;
  tags: string;
  image?: string;
  website?: string;
  biography?: string;
  publicEmail?: string;
};

export type PublicFaculty = {
  id: string;
  name: string;
  category: 'CORE' | 'ADJUNCT' | 'ASSOCIATE' | 'VISITING';
  designation: string;
  department: string;
  interests: string;
  biography: string;
  imageUrl: string;
  websiteUrl: string;
  publicEmail: string;
};

export type CoreFaculty = Faculty & {
  role: string;
};
