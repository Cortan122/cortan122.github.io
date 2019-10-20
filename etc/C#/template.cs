using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

/// <summary>
/// Задание с экзамена №1
/// </summary>
/// <remarks>
/// <para>Автор: Борисов Костя</para>
/// <para>Группа: БПИ199</para>
/// <para>Дата: 23.10.2019</para>
/// </remarks>
namespace Шаблон
{
    class Program
    {
        /// <summary>
        /// Считавыет целое число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
        /// Если цисло неправильное, просит ввести его повторено.
        /// </summary>
        /// <returns>
        /// Введенное число.
        /// </returns>
        /// <param name="name">Название этого числа.</param>
        /// <param name="lowerBound">Минимально возможное значение числа.</param>
        /// <param name="upperBound">Максимально возможное значение числа.</param>
        static int ReadInt(string name = "целое число", int lowerBound = int.MinValue, int upperBound = int.MaxValue)
        {
            int r;
            bool t;
            do
            {
                Console.Write("Введите {0} (int): ", name);
                t = !int.TryParse(Console.ReadLine(), out r);
                if (r < lowerBound || r > upperBound) t = true;
            } while (t);
            return r;
        }

        /// <summary>
        /// Считавыет действительное число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
        /// Если цисло неправильное, просит ввести его повторено.
        /// </summary>
        /// <returns>
        /// Введенное число.
        /// </returns>
        /// <param name="name">Название этого числа.</param>
        /// <param name="lowerBound">Минимально возможное значение числа.</param>
        /// <param name="upperBound">Максимально возможное значение числа.</param>
        static double ReadDouble(string name = "действительное число", double lowerBound = double.MinValue, double upperBound = double.MaxValue)
        {
            double r;
            do
            {
                Console.Write("Введите {0} (double): ", name);
            } while (!double.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
            return r;
        }

        /// <summary>
        /// Запускает f() и предлогает пользователю повторить.
        /// </summary>
        static void Loop(Action f)
        {
            do
            {
                f();
                // if Console.IsOutputRedirected is True Console.ReadKey() throws an exeption
                if (Console.IsOutputRedirected) return;
                Console.WriteLine("Нажмите Enter чтобы повторить");
            } while (Console.ReadKey().Key == ConsoleKey.Enter);
        }

        /// <summary>
        /// Безопасно совершает некую операцию f() над какимто файлом.
        /// Если произошла ошибка вызывает error(ошибка) или (если error == null) завершает программу.
        /// </summary>
        static T CatchFileExeptions<T>(Func<T> f, Action<string> error = null)
        {
            if (error == null) error = (e) =>
            {
                Console.WriteLine(e);
                Environment.Exit(0);
            };
            try
            {
                return f();
            }
            catch (FileNotFoundException e)
            {
                error("Файл не существует");
            }
            catch (IOException e)
            {
                error("Ошибка ввода-вывода");
            }
            catch (System.Security.SecurityException e)
            {
                error("Ошибка безопасности");
            }
            catch (UnauthorizedAccessException e)
            {
                error("У вас нет разрешения на создание/чтение файла");
            }
            return default(T);
        }

        // Перегрузка наслучай, если f ничего не возвращает.
        static void CatchFileExeptions(Action f, Action<string> error = null)
        {
            CatchFileExeptions(() => { f(); return 1; }, error);
        }

        static void Main()
        {
            Loop(() =>
            {
                // your code goes here
            });
        }
    }
}
