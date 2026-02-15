import { Link } from 'react-router-dom'
import { Github, Twitter, Mail } from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="container-page px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent">
                Yusi
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              把灵魂放进情景，更懂彼此。
              <br />
              开启一段发现自我与连接他人的奇妙旅程。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">平台</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/plaza" className="hover:text-primary transition-colors">灵魂广场</Link></li>
              <li><Link to="/room" className="hover:text-primary transition-colors">情景室</Link></li>
              <li><Link to="/diary" className="hover:text-primary transition-colors">AI知己</Link></li>
              <li><Link to="/match" className="hover:text-primary transition-colors">灵魂匹配</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">关于</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">关于我们</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">建议反馈</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">隐私政策</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">用户协议</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">联系我们</h4>
            <div className="flex space-x-4">
              <a href="https://github.com/Aseubel" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="mailto:yangaseubel@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Yusi. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Designed with ❤️ for Souls</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
