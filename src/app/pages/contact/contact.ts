import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
   
  ],
  template: `
   
      <div class="contact-container">
        <!-- Main Form Area (Center) -->
        <div class="contact-header">
          <h1>Get in <span class="accent">Touch</span></h1>
          <p>Have a question or want to collaborate? Send us a message.</p>
        </div>

        <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form glass-card">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" formControlName="name" placeholder="John Doe">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" formControlName="email" placeholder="john@example.com">
            </div>
          </div>

          <div class="form-group">
            <label>Subject</label>
            <input type="text" formControlName="subject" placeholder="Collaboration Inquiry">
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea formControlName="message" rows="5" placeholder="How can we help you?"></textarea>
          </div>

          <button type="submit" class="btn-primary" [disabled]="contactForm.invalid">
            Send Message <i class="fas fa-paper-plane"></i>
          </button>
        </form>

        <!-- Right Side Panel Content -->
        <div slot="right-panel">
          <div class="contact-info glass-card">
            <h3 class="panel-title"><i class="fas fa-address-card"></i> Contact Info</h3>
            
            <div class="info-item">
              <div class="info-icon"><i class="fas fa-envelope"></i></div>
              <div class="info-content">
                <label>Email Us</label>
                <p>support@ceekulmission.org</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-phone"></i></div>
              <div class="info-content">
                <label>Call Us</label>
                <p>+91 123 456 7890</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-map-marker-alt"></i></div>
              <div class="info-content">
                <label>Visit Us</label>
                <p>Raebareli, Uttar Pradesh,<br>India - 229001</p>
              </div>
            </div>

            <div class="social-links">
              <h4>Follow Us</h4>
              <div class="social-icons">
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-facebook"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
                <a href="#"><i class="fab fa-linkedin"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
  `,
  styles: [`
    .contact-container { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
    
    .contact-header {
      text-align: center; margin-bottom: 3rem;
      h1 { font-family: 'Montserrat', sans-serif; font-size: 3rem; font-weight: 900; color: #fff; margin-bottom: 1rem;
        .accent { color: var(--accent-primary); }
      }
      p { color: color-mix(in srgb, #fff, transparent 40%); font-size: 1.1rem; }
    }

    .contact-form {
      padding: 3rem; border-radius: 24px; background: color-mix(in srgb, #fff, transparent 98%); border: 1px solid color-mix(in srgb, #fff, transparent 95%);
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    }

    .form-group {
      margin-bottom: 1.5rem;
      label { display: block; color: color-mix(in srgb, #fff, transparent 60%); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8rem; }
      input, textarea {
        width: 100%; background: color-mix(in srgb, #fff, transparent 97%); border: 1px solid color-mix(in srgb, #fff, transparent 90%); border-radius: 12px;
        padding: 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; transition: all 0.3s ease;
        &:focus { outline: none; border-color: var(--accent-primary); background: color-mix(in srgb, #fff, transparent 94%); }
      }
    }

    .btn-primary {
      width: 100%; padding: 1.2rem; background: var(--accent-primary); color: #000; border: none; border-radius: 12px;
      font-weight: 800; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      &:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 20px color-mix(in srgb, #FF6B00, transparent 80%); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      i { margin-left: 0.8rem; }
    }

    .contact-info {
      padding: 2rem; border-radius: 24px; position: sticky; top: 2rem;margin-top:2rem;
      .panel-title { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 0.8rem; i { color: var(--accent-primary); } }
    }

    .info-item {
      display: flex; gap: 1.2rem; margin-bottom: 2rem;
      .info-icon { width: 44px; height: 44px; background: color-mix(in srgb, #FF6B00, transparent 90%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent-primary); font-size: 1.1rem; flex-shrink: 0; }
      .info-content {
        label { display: block; color: color-mix(in srgb, #fff, transparent 70%); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem; }
        p { color: #fff; font-size: 0.9rem; line-height: 1.4; }
      }
    }

    .social-links {
      margin-top: 3rem; padding-top: 2rem; border-top: 1px solid color-mix(in srgb, #fff, transparent 95%);
      h4 { font-size: 0.75rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; margin-bottom: 1.5rem; letter-spacing: 1px; }
      .social-icons {
        display: flex; gap: 1rem;
        a { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, #fff, transparent 97%); display: flex; align-items: center; justify-content: center; color: #fff; transition: all 0.3s ease; border: 1px solid color-mix(in srgb, #fff, transparent 95%);
          &:hover { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); transform: translateY(-2px); }
        }
      }
    }

    @media (max-width: 768px) {
      .contact-form { padding: 1.5rem; }
      .contact-form .form-grid { grid-template-columns: 1fr; gap: 1rem; }
      .contact-header h1 { font-size: 2rem; }
    }
  `]
})
export class ContactPageComponent {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Form Submitted', this.contactForm.value);
      alert('Message sent successfully! (Mock)');
      this.contactForm.reset();
    }
  }
}
