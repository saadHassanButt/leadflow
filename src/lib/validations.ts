// Validation schemas using simple validation functions
// These can be replaced with zod when the dependency is installed

export const validateProject = (data: any) => {
  const errors: Record<string, string> = {};
  
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Project name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Project name too long';
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (data.description.length > 500) {
    errors.description = 'Description too long';
  }
  
  if (!data.companyName || data.companyName.trim().length === 0) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.length > 100) {
    errors.companyName = 'Company name too long';
  }
  
  if (!data.companyEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.companyEmail)) {
    errors.companyEmail = 'Invalid email address';
  }
  
  if (!data.niche || data.niche.trim().length === 0) {
    errors.niche = 'Please select a niche';
  }
  
  if (!data.targetCount || data.targetCount < 1) {
    errors.targetCount = 'Target count must be at least 1';
  } else if (data.targetCount > 10000) {
    errors.targetCount = 'Target count too high';
  }
  
  if (!data.campaignType || data.campaignType.trim().length === 0) {
    errors.campaignType = 'Please select a campaign type';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLead = (data: any) => {
  const errors: Record<string, string> = {};
  
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.length > 50) {
    errors.firstName = 'First name too long';
  }
  
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.length > 50) {
    errors.lastName = 'Last name too long';
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (!data.company || data.company.trim().length === 0) {
    errors.company = 'Company is required';
  } else if (data.company.length > 100) {
    errors.company = 'Company name too long';
  }
  
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.length > 100) {
    errors.title = 'Title too long';
  }
  
  if (data.linkedinUrl && data.linkedinUrl.trim().length > 0) {
    try {
      new URL(data.linkedinUrl);
    } catch {
      errors.linkedinUrl = 'Invalid LinkedIn URL';
    }
  }
  
  if (!data.industry || data.industry.trim().length === 0) {
    errors.industry = 'Industry is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTemplate = (data: any) => {
  const errors: Record<string, string> = {};
  
  if (!data.subject || data.subject.trim().length === 0) {
    errors.subject = 'Subject is required';
  } else if (data.subject.length > 200) {
    errors.subject = 'Subject too long';
  }
  
  if (!data.content || data.content.trim().length === 0) {
    errors.content = 'Content is required';
  } else if (data.content.length > 5000) {
    errors.content = 'Content too long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
