import React, { useEffect, useRef } from 'react';

const InteractiveParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Config
    const particleCount = width < 768 ? 60 : 140; // Dense but performant
    const connectionDistance = width < 768 ? 100 : 160;
    const mouseRadius = 250;
    const mouseForce = 3;

    let particles = [];
    let mouse = { x: null, y: null };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Base velocity for drift
        this.vx = (Math.random() - 0.5) * 0.8; 
        this.vy = (Math.random() - 0.5) * 0.8;
        // Target positions (for returning origin behavior if desired, but we'll do free float with repulsion)
        this.size = Math.random() * 2 + 1.5;
        this.baseSize = this.size;
        this.density = Math.random() * 30 + 1; // mass variance
        this.color = null; 
      }

      update() {
        // 1. Basic Drift
        this.x += this.vx;
        this.y += this.vy;

        // 2. Mouse Interaction (Repulsion with easing)
        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRadius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouseRadius - distance) / mouseRadius; // 0 to 1
            const directionX = forceDirectionX * force * this.density;
            const directionY = forceDirectionY * force * this.density;

            // Push away
            this.x -= directionX;
            this.y -= directionY;
            
            // Slightly grow
            if (this.size < 5) this.size += 0.2;
          } else {
             // Shrink back
             if (this.size > this.baseSize) this.size -= 0.1;
          }
        }

        // 3. Screen Wrap/Bounce
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        const isDark = document.documentElement.classList.contains("dark");
        // Colors
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15, 23, 42, 0.7)';
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            // Opacity based on distance
            let opacity = 1 - distance / connectionDistance;
            
            // Color based on theme
            if (isDark) {
               ctx.strokeStyle = `rgba(45, 212, 191, ${opacity * 0.4})`; // Teal-400 hint
            } else {
               ctx.strokeStyle = `rgba(100, 116, 139, ${opacity * 0.4})`; // Slate-500 hint
            }

            ctx.lineWidth = 0.8; 
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    init();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
};

export default InteractiveParticles;
